import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { parseSettings } from '@/lib/domain/settings'
import type { BusinessSettings } from '@/lib/consignment/types'

export interface RawSettingsRow {
  commissione_ebay_percent: number
  scaglioni: unknown
  giorni_maturazione: number
  minimo_prelievo: number
}
export type RawSettingsInput = RawSettingsRow

export async function getRawSettings(): Promise<RawSettingsRow> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('impostazioni')
    .select('commissione_ebay_percent, scaglioni, giorni_maturazione, minimo_prelievo')
    .eq('id', 1)
    .single()
  if (error) throw new Error(`Lettura impostazioni fallita: ${error.message}`)
  return data as RawSettingsRow
}

export async function getSettings(): Promise<BusinessSettings> {
  return parseSettings(await getRawSettings())
}

export async function updateSettings(input: RawSettingsInput): Promise<void> {
  // Valida prima di scrivere: se malformato, lancia e non tocca il DB.
  parseSettings(input)
  const supabase = createServiceClient()
  const { error } = await supabase.from('impostazioni').update(input).eq('id', 1)
  if (error) throw new Error(`Aggiornamento impostazioni fallito: ${error.message}`)
}
