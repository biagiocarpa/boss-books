import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/data/settings'
import { computeBalance, type SoldBook, type SoldBookStatus, type Balance } from '@/lib/consignment/balance'

export interface ClientBookView {
  sku: string
  titolo: string
  stato: string
  prezzo_vendita: number | null
  quota_cliente: number | null
  data_vendita: string | null
  inPendingRequest: boolean
}

export interface ClientDashboard {
  cliente: { id: string; nome: string }
  libri: ClientBookView[]
  balance: Balance
  pending: { id: string; importo: number; data_richiesta: string } | null
}

export async function getClientDashboard(codice: string): Promise<ClientDashboard | null> {
  const supabase = createServiceClient()

  const { data: cliente, error: cErr } = await supabase
    .from('clienti')
    .select('id, nome')
    .eq('id', codice)
    .maybeSingle()
  if (cErr) throw new Error(`Lettura cliente fallita: ${cErr.message}`)
  if (!cliente) return null

  const { data: libriRows, error: lErr } = await supabase
    .from('libri')
    .select('sku, titolo, stato, prezzo_vendita, data_vendita, quota_cliente, richiesta_id')
    .eq('cliente_id', codice)
    .order('sku')
  if (lErr) throw new Error(`Lettura libri fallita: ${lErr.message}`)

  const { data: pendingRow, error: pErr } = await supabase
    .from('richieste_pagamento')
    .select('id, importo, data_richiesta')
    .eq('cliente_id', codice)
    .eq('stato', 'richiesta')
    .maybeSingle()
  if (pErr) throw new Error(`Lettura richiesta fallita: ${pErr.message}`)

  const libri: ClientBookView[] = (libriRows ?? []).map((l) => ({
    sku: l.sku,
    titolo: l.titolo,
    stato: l.stato,
    prezzo_vendita: l.prezzo_vendita,
    quota_cliente: l.quota_cliente,
    data_vendita: l.data_vendita,
    inPendingRequest: l.stato === 'venduto' && l.richiesta_id != null,
  }))

  const settings = await getSettings()
  const soldBooks: SoldBook[] = libri
    .filter(
      (l) =>
        ['venduto', 'pagato', 'reso'].includes(l.stato) && l.quota_cliente != null && l.data_vendita != null,
    )
    .map((l) => ({
      clientAmount: l.quota_cliente as number,
      saleDate: new Date(l.data_vendita as string),
      status: l.stato as SoldBookStatus,
      inPendingRequest: l.inPendingRequest,
    }))

  const balance = computeBalance(soldBooks, new Date(), settings.maturationDays)

  return {
    cliente: { id: cliente.id, nome: cliente.nome },
    libri,
    balance,
    pending: pendingRow
      ? { id: pendingRow.id, importo: pendingRow.importo, data_richiesta: pendingRow.data_richiesta }
      : null,
  }
}
