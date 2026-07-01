import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { buildSku } from '@/lib/domain/id'
import { getSettings } from '@/lib/data/settings'
import { clientShare } from '@/lib/consignment/calculate'

export interface BookRow {
  sku: string
  cliente_id: string
  titolo: string
  prezzo_listino: number
  stato: string
  prezzo_vendita: number | null
  data_vendita: string | null
  quota_cliente: number | null
}

export async function listBooksByClient(clienteId: string): Promise<BookRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('libri')
    .select('sku, cliente_id, titolo, prezzo_listino, stato, prezzo_vendita, data_vendita, quota_cliente')
    .eq('cliente_id', clienteId)
    .order('sku')
  if (error) throw new Error(`Lettura libri fallita: ${error.message}`)
  return (data ?? []) as BookRow[]
}

export async function createBook(input: {
  clienteId: string
  titolo: string
  prezzoListino: number
}): Promise<{ sku: string }> {
  const supabase = createServiceClient()
  // Prossimo suffisso = numero di libri già del cliente + 1
  const { count, error: cErr } = await supabase
    .from('libri')
    .select('sku', { count: 'exact', head: true })
    .eq('cliente_id', input.clienteId)
  if (cErr) throw new Error(`Conteggio libri fallito: ${cErr.message}`)
  const sku = buildSku(input.clienteId, (count ?? 0) + 1)

  const { error } = await supabase.from('libri').insert({
    sku,
    cliente_id: input.clienteId,
    titolo: input.titolo,
    prezzo_listino: input.prezzoListino,
    stato: 'in_vendita',
  })
  if (error) throw new Error(`Creazione libro fallita: ${error.message}`)
  return { sku }
}

export async function markSold(sku: string, prezzoVendita: number): Promise<void> {
  const settings = await getSettings()
  const { clientAmount } = clientShare(prezzoVendita, settings)
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('libri')
    .update({
      stato: 'venduto',
      prezzo_vendita: prezzoVendita,
      data_vendita: new Date().toISOString(),
      quota_cliente: clientAmount,
    })
    .eq('sku', sku)
    .eq('stato', 'in_vendita') // solo un libro ancora in vendita può essere venduto
  if (error) throw new Error(`Marcatura venduto fallita: ${error.message}`)
}

export async function markReturned(sku: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('libri')
    .update({ stato: 'reso', prezzo_vendita: null, data_vendita: null, quota_cliente: null })
    .eq('sku', sku)
  if (error) throw new Error(`Marcatura reso fallita: ${error.message}`)
}
