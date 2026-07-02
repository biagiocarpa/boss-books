'use server'
import { revalidatePath } from 'next/cache'
import { createBook, markSold, markReturned } from '@/lib/data/books'

export async function addBookAction(clienteId: string, formData: FormData) {
  const titolo = String(formData.get('titolo') ?? '').trim()
  const prezzo = Number(formData.get('prezzo_listino'))
  if (!titolo) throw new Error('Il titolo è obbligatorio')
  if (!Number.isFinite(prezzo) || prezzo <= 0) throw new Error('Prezzo non valido')
  await createBook({ clienteId, titolo, prezzoListino: prezzo })
  revalidatePath(`/admin/clienti/${clienteId}`)
}

export async function markSoldAction(clienteId: string, formData: FormData) {
  const sku = String(formData.get('sku') ?? '').trim()
  if (!sku) throw new Error('SKU mancante')
  const prezzo = Number(formData.get('prezzo_vendita'))
  if (!Number.isFinite(prezzo) || prezzo <= 0) throw new Error('Prezzo di vendita non valido')
  await markSold(sku, prezzo)
  revalidatePath(`/admin/clienti/${clienteId}`)
}

export async function markReturnedAction(clienteId: string, formData: FormData) {
  const sku = String(formData.get('sku') ?? '').trim()
  if (!sku) throw new Error('SKU mancante')
  await markReturned(sku)
  revalidatePath(`/admin/clienti/${clienteId}`)
}
