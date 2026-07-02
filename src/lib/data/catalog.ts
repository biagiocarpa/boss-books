import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

/** Voce del catalogo pubblico: SOLI dati pubblici (mai cliente_id o quote). */
export interface CatalogBook {
  titolo: string
  stato: 'in_vendita' | 'venduto'
  prezzo: number
}

/** Tutti i libri del boss (esclusi i resi), con i soli campi pubblici stile eBay. */
export async function listCatalog(): Promise<CatalogBook[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('libri')
    .select('titolo, stato, prezzo_listino, prezzo_vendita')
    .neq('stato', 'reso')
    .order('titolo')
  if (error) throw new Error(`Lettura catalogo fallita: ${error.message}`)

  const books: CatalogBook[] = (data ?? []).map((l) => {
    const venduto = l.stato === 'venduto' || l.stato === 'pagato'
    return {
      titolo: l.titolo,
      stato: venduto ? 'venduto' : 'in_vendita',
      prezzo: venduto ? (l.prezzo_vendita ?? l.prezzo_listino) : l.prezzo_listino,
    }
  })
  // In vendita prima, poi venduti (entrambi già in ordine di titolo dalla query)
  return [...books.filter((b) => b.stato === 'in_vendita'), ...books.filter((b) => b.stato === 'venduto')]
}
