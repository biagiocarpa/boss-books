'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/data/clients'

export async function createClientAction(formData: FormData) {
  const nome = String(formData.get('nome') ?? '').trim()
  if (!nome) throw new Error('Il nome è obbligatorio')
  await createClient({
    nome,
    contatti: String(formData.get('contatti') ?? '').trim() || undefined,
    dati_pagamento: String(formData.get('dati_pagamento') ?? '').trim() || undefined,
    note: String(formData.get('note') ?? '').trim() || undefined,
  })
  revalidatePath('/admin')
}
