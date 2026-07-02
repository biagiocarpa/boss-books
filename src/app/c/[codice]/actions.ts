'use server'
import { revalidatePath } from 'next/cache'
import { createPaymentRequest } from '@/lib/data/requests'
import { notifyPaymentRequest } from '@/lib/email/notify'
import { createServiceClient } from '@/lib/supabase/server'

export async function requestPaymentAction(codice: string) {
  const { importo } = await createPaymentRequest(codice)

  // Recupera nome + dati pagamento per l'email (fail-safe: non deve far fallire la richiesta)
  try {
    const supabase = createServiceClient()
    const { data } = await supabase.from('clienti').select('nome, dati_pagamento').eq('id', codice).maybeSingle()
    await notifyPaymentRequest({
      nome: data?.nome ?? '',
      importo,
      datiPagamento: data?.dati_pagamento ?? null,
      codice,
    })
  } catch {
    // notifyPaymentRequest è già fail-safe; questo catch copre solo la lettura nome
  }

  revalidatePath(`/c/${codice}`)
}
