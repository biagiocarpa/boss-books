import type { BusinessSettings, Breakdown, CommissionTier } from './types'

/** Arrotonda a 2 decimali (centesimi), half-up. */
export function roundCents(value: number): number {
  const cents = value * 100
  return Math.round(cents + (cents >= 0 ? 1 : -1) * 1e-9) / 100
}

/**
 * Restituisce la percentuale trattenuta dal boss per un dato prezzo.
 * Gli scaglioni sono ordinati per maxPrice crescente; l'ultimo ha maxPrice null.
 */
export function sellerPercentForPrice(price: number, tiers: CommissionTier[]): number {
  for (const tier of tiers) {
    if (tier.maxPrice === null || price <= tier.maxPrice) {
      return tier.sellerPercent
    }
  }
  throw new Error('Nessuno scaglione applicabile: manca la fascia superiore (maxPrice null)')
}

/** Scompone il ricavo di un libro venduto in netto, quota boss e quota cliente. */
export function clientShare(salePrice: number, settings: BusinessSettings): Breakdown {
  const net = roundCents(salePrice - salePrice * (settings.ebayCommissionPercent / 100))
  const sellerPercent = sellerPercentForPrice(salePrice, settings.tiers)
  const sellerCut = roundCents(net * (sellerPercent / 100))
  const clientAmount = roundCents(net - sellerCut)
  return { net, sellerCut, clientAmount }
}
