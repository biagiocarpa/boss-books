'use server'
import { revalidatePath } from 'next/cache'
import { markRequestPaid } from '@/lib/data/requests'

export async function markPaidAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) throw new Error('ID richiesta mancante')
  await markRequestPaid(id)
  revalidatePath('/admin/richieste')
}
