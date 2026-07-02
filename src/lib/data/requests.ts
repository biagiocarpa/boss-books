import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/data/settings'
import { roundCents } from '@/lib/consignment/calculate'
import { isMatured } from '@/lib/consignment/balance'

export async function createPaymentRequest(clienteId: string): Promise<{ id: string; importo: number }> {
  const supabase = createServiceClient()
  const settings = await getSettings()

  // 1. Nessuna richiesta già in attesa
  const { data: existing, error: exErr } = await supabase
    .from('richieste_pagamento')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('stato', 'richiesta')
    .maybeSingle()
  if (exErr) throw new Error(`Verifica richiesta esistente fallita: ${exErr.message}`)
  if (existing) throw new Error('Hai già una richiesta di pagamento in lavorazione.')

  // 2. Libri incassabili: venduto, non ancora in una richiesta, maturati
  const { data: libri, error: lErr } = await supabase
    .from('libri')
    .select('sku, quota_cliente, data_vendita')
    .eq('cliente_id', clienteId)
    .eq('stato', 'venduto')
    .is('richiesta_id', null)
  if (lErr) throw new Error(`Lettura libri fallita: ${lErr.message}`)

  const now = new Date()
  const incassabili = (libri ?? []).filter(
    (l) =>
      l.data_vendita != null &&
      l.quota_cliente != null &&
      isMatured(new Date(l.data_vendita), now, settings.maturationDays),
  )
  if (incassabili.length === 0) throw new Error('Nessun importo disponibile da richiedere.')

  const importo = roundCents(incassabili.reduce((sum, l) => sum + (l.quota_cliente as number), 0))
  if (importo < settings.minWithdrawal) {
    throw new Error(
      `Il disponibile (${importo.toFixed(2)} €) è sotto il minimo di ${settings.minWithdrawal.toFixed(2)} €.`,
    )
  }

  // 3. Crea la richiesta
  const { data: reqRow, error: rErr } = await supabase
    .from('richieste_pagamento')
    .insert({ cliente_id: clienteId, importo, stato: 'richiesta' })
    .select('id')
    .single()
  if (rErr) throw new Error(`Creazione richiesta fallita: ${rErr.message}`)

  // 4. Aggancia i libri incassabili alla richiesta
  const skus = incassabili.map((l) => l.sku)
  const { error: uErr } = await supabase.from('libri').update({ richiesta_id: reqRow.id }).in('sku', skus)
  if (uErr) throw new Error(`Aggancio libri alla richiesta fallito: ${uErr.message}`)

  return { id: reqRow.id, importo }
}

export interface PendingRequestView {
  id: string
  cliente_id: string
  nome: string
  dati_pagamento: string | null
  importo: number
  data_richiesta: string
  libri: { sku: string; titolo: string }[]
}

export async function listPendingRequests(): Promise<PendingRequestView[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('richieste_pagamento')
    .select('id, cliente_id, importo, data_richiesta, clienti(nome, dati_pagamento), libri(sku, titolo)')
    .eq('stato', 'richiesta')
    .order('data_richiesta')
  if (error) throw new Error(`Lettura richieste fallita: ${error.message}`)
  return (data ?? []).map((r) => {
    const cliente = Array.isArray(r.clienti) ? r.clienti[0] : r.clienti
    return {
      id: r.id,
      cliente_id: r.cliente_id,
      nome: cliente?.nome ?? '',
      dati_pagamento: cliente?.dati_pagamento ?? null,
      importo: r.importo,
      data_richiesta: r.data_richiesta,
      libri: (r.libri ?? []).map((l: { sku: string; titolo: string }) => ({ sku: l.sku, titolo: l.titolo })),
    }
  })
}

export async function markRequestPaid(id: string): Promise<void> {
  const supabase = createServiceClient()

  // Segna i libri agganciati come pagato
  const { error: lErr } = await supabase
    .from('libri')
    .update({ stato: 'pagato' })
    .eq('richiesta_id', id)
    .eq('stato', 'venduto')
    .select('sku')
  if (lErr) throw new Error(`Aggiornamento libri pagati fallito: ${lErr.message}`)

  // Segna la richiesta pagata solo se ancora in attesa
  const { data: reqUpd, error: rErr } = await supabase
    .from('richieste_pagamento')
    .update({ stato: 'pagata', data_pagamento: new Date().toISOString() })
    .eq('id', id)
    .eq('stato', 'richiesta')
    .select('id')
  if (rErr) throw new Error(`Aggiornamento richiesta fallito: ${rErr.message}`)
  if (!reqUpd || reqUpd.length === 0) {
    throw new Error('Richiesta inesistente o già evasa.')
  }
}

export interface PaidRequestView {
  importo: number
  data_pagamento: string
}

/** Storico pagamenti del cliente: richieste pagate, più recenti prima. */
export async function listPaidRequests(clienteId: string): Promise<PaidRequestView[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('richieste_pagamento')
    .select('importo, data_pagamento')
    .eq('cliente_id', clienteId)
    .eq('stato', 'pagata')
    .order('data_pagamento', { ascending: false })
  if (error) throw new Error(`Lettura storico pagamenti fallita: ${error.message}`)
  return (data ?? []).filter((r) => r.data_pagamento != null) as PaidRequestView[]
}
