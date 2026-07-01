import { describe, it, expect } from 'vitest'
import { roundCents, sellerPercentForPrice, clientShare } from './calculate'
import type { CommissionTier, BusinessSettings } from './types'

describe('roundCents', () => {
  it('arrotonda a 2 decimali (half-up)', () => {
    expect(roundCents(9.5)).toBe(9.5)
    expect(roundCents(5.705)).toBe(5.71)
    expect(roundCents(28.499)).toBe(28.5)
  })

  it('arrotonda per eccesso i valori .xx5 anche quando la rappresentazione float li porta sotto la metà (half-up vero)', () => {
    expect(roundCents(2.015)).toBe(2.02)
    expect(roundCents(2.135)).toBe(2.14)
    expect(roundCents(2.675)).toBe(2.68)
  })
})

describe('sellerPercentForPrice', () => {
  const tiers: CommissionTier[] = [
    { maxPrice: 20, sellerPercent: 60 },
    { maxPrice: 50, sellerPercent: 40 },
    { maxPrice: null, sellerPercent: 30 },
  ]

  it('sceglie la fascia bassa per libri economici', () => {
    expect(sellerPercentForPrice(10, tiers)).toBe(60)
    expect(sellerPercentForPrice(20, tiers)).toBe(60) // bordo incluso
  })

  it('sceglie la fascia intermedia', () => {
    expect(sellerPercentForPrice(35, tiers)).toBe(40)
  })

  it('sceglie la fascia superiore senza limite', () => {
    expect(sellerPercentForPrice(100, tiers)).toBe(30)
  })

  it('lancia un errore se manca la fascia superiore (nessun maxPrice null)', () => {
    const brokenTiers: CommissionTier[] = [
      { maxPrice: 20, sellerPercent: 60 },
      { maxPrice: 50, sellerPercent: 40 },
    ]
    expect(() => sellerPercentForPrice(100, brokenTiers)).toThrow()
  })
})

describe('clientShare', () => {
  const settings: BusinessSettings = {
    ebayCommissionPercent: 5,
    tiers: [
      { maxPrice: 20, sellerPercent: 60 },
      { maxPrice: 50, sellerPercent: 40 },
      { maxPrice: null, sellerPercent: 30 },
    ],
    maturationDays: 30,
    minWithdrawal: 20,
  }

  it('libro economico 10€ → cliente 3,80€', () => {
    const b = clientShare(10, settings)
    expect(b.net).toBe(9.5)
    expect(b.sellerCut).toBe(5.7)
    expect(b.clientAmount).toBe(3.8)
  })

  it('libro costoso 100€ → cliente 66,50€', () => {
    const b = clientShare(100, settings)
    expect(b.net).toBe(95)
    expect(b.sellerCut).toBe(28.5)
    expect(b.clientAmount).toBe(66.5)
  })

  it('le quote si sommano al netto senza sfasare di un centesimo', () => {
    const b = clientShare(33.33, settings)
    expect(roundCents(b.sellerCut + b.clientAmount)).toBe(b.net)
  })
})
