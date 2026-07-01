import { describe, it, expect } from 'vitest'
import { parseSettings } from './settings'

const validRow = {
  commissione_ebay_percent: 5,
  scaglioni: [
    { maxPrice: 20, sellerPercent: 60 },
    { maxPrice: null, sellerPercent: 30 },
    { maxPrice: 50, sellerPercent: 40 },
  ],
  giorni_maturazione: 30,
  minimo_prelievo: 20,
}

describe('parseSettings', () => {
  it('mappa una riga valida e ordina gli scaglioni (null ultimo)', () => {
    const s = parseSettings(validRow)
    expect(s.ebayCommissionPercent).toBe(5)
    expect(s.maturationDays).toBe(30)
    expect(s.minWithdrawal).toBe(20)
    expect(s.tiers.map((t) => t.maxPrice)).toEqual([20, 50, null])
    expect(s.tiers.map((t) => t.sellerPercent)).toEqual([60, 40, 30])
  })

  it('lancia se manca lo scaglione terminale (nessun maxPrice null)', () => {
    const bad = { ...validRow, scaglioni: [{ maxPrice: 20, sellerPercent: 60 }] }
    expect(() => parseSettings(bad)).toThrow(/terminale|null/i)
  })

  it('lancia su percentuali fuori range', () => {
    const bad = { ...validRow, commissione_ebay_percent: 150 }
    expect(() => parseSettings(bad)).toThrow()
  })
})
