'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { updateSettings } from '@/lib/data/settings'

function redirectWithError(): never {
  redirect('/admin/impostazioni?errore=1')
}

export async function saveSettingsAction(formData: FormData) {
  let scaglioni: unknown
  try {
    scaglioni = JSON.parse(String(formData.get('scaglioni') ?? '[]'))
  } catch {
    redirectWithError()
  }
  try {
    await updateSettings({
      commissione_ebay_percent: Number(formData.get('commissione_ebay_percent')),
      giorni_maturazione: Number(formData.get('giorni_maturazione')),
      minimo_prelievo: Number(formData.get('minimo_prelievo')),
      scaglioni,
    })
  } catch {
    redirectWithError()
  }
  revalidatePath('/admin/impostazioni')
  redirect('/admin/impostazioni?ok=1')
}
