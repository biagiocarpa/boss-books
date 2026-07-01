import { z } from 'zod'
import type { BusinessSettings } from '@/lib/consignment/types'

const percent = z.number().min(0).max(100)

const tierSchema = z.object({
  maxPrice: z.number().positive().nullable(),
  sellerPercent: percent,
})

const rowSchema = z.object({
  commissione_ebay_percent: percent,
  scaglioni: z.array(tierSchema),
  giorni_maturazione: z.number().int().positive(),
  minimo_prelievo: z.number().min(0),
})

/**
 * Valida una riga `impostazioni` e la mappa su BusinessSettings.
 * Ordina gli scaglioni per maxPrice crescente con il terminale (null) in fondo.
 * Lancia se malformata o se manca lo scaglione terminale.
 */
export function parseSettings(row: unknown): BusinessSettings {
  const r = rowSchema.parse(row)

  const hasTerminal = r.scaglioni.some((t) => t.maxPrice === null)
  if (!hasTerminal) {
    throw new Error('Scaglioni non validi: manca la fascia terminale (uno scaglione con maxPrice null)')
  }

  const tiers = [...r.scaglioni].sort((a, b) => {
    if (a.maxPrice === null) return 1
    if (b.maxPrice === null) return -1
    return a.maxPrice - b.maxPrice
  })

  return {
    ebayCommissionPercent: r.commissione_ebay_percent,
    tiers,
    maturationDays: r.giorni_maturazione,
    minWithdrawal: r.minimo_prelievo,
  }
}
