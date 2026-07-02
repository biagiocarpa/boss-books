'use server'
import { redirect } from 'next/navigation'
import { isValidClientId } from '@/lib/domain/id'

/** Porta al profilo personale a partire dal codice a 8 cifre. */
export async function vaiAlProfiloAction(formData: FormData) {
  const codice = String(formData.get('codice') ?? '').trim()
  if (!isValidClientId(codice)) redirect('/profilo?errore=1')
  redirect(`/c/${codice}`)
}
