import { describe, it, expect } from 'vitest'
import { isMatured, computeBalance, canRequestPayout } from './balance'
import type { SoldBook } from './balance'

describe('isMatured', () => {
  it('non maturo dentro la finestra di 30 giorni', () => {
    const sale = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-20T00:00:00Z') // +19 giorni
    expect(isMatured(sale, now, 30)).toBe(false)
  })

  it('maturo esattamente al 30° giorno', () => {
    const sale = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-31T00:00:00Z') // +30 giorni
    expect(isMatured(sale, now, 30)).toBe(true)
  })

  it('maturo oltre i 30 giorni', () => {
    const sale = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-03-01T00:00:00Z')
    expect(isMatured(sale, now, 30)).toBe(true)
  })
})

describe('computeBalance', () => {
  const now = new Date('2026-02-15T00:00:00Z')

  it('separa disponibile, in maturazione, in richiesta e pagato; ignora i resi', () => {
    const books: SoldBook[] = [
      { clientAmount: 10, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'venduto' }, // maturo, non in richiesta -> disponibile
      { clientAmount: 7, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'venduto', inPendingRequest: true }, // maturo ma in richiesta -> requested
      { clientAmount: 5, saleDate: new Date('2026-02-10T00:00:00Z'), status: 'venduto' },  // in maturazione
      { clientAmount: 20, saleDate: new Date('2025-12-01T00:00:00Z'), status: 'pagato' },  // pagato
      { clientAmount: 99, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'reso' },    // ignorato
    ]
    const b = computeBalance(books, now, 30)
    expect(b.available).toBe(10)
    expect(b.requested).toBe(7)
    expect(b.maturing).toBe(5)
    expect(b.paid).toBe(20)
  })

  it('lista vuota → conto azzerato', () => {
    const b = computeBalance([], now, 30)
    expect(b).toEqual({ available: 0, maturing: 0, requested: 0, paid: 0 })
  })

  it('un libro pagato di recente (dentro la finestra di maturazione) resta in paid, non in maturing', () => {
    const books: SoldBook[] = [
      {
        clientAmount: 15,
        saleDate: new Date('2026-02-10T00:00:00Z'), // 5 giorni prima di `now`, dentro i 30gg
        status: 'pagato',
      },
    ]
    const b = computeBalance(books, now, 30)
    expect(b.paid).toBe(15)
    expect(b.maturing).toBe(0)
  })
})

describe('canRequestPayout', () => {
  it('vero solo se il disponibile raggiunge il minimo', () => {
    expect(canRequestPayout({ available: 25, maturing: 0, requested: 0, paid: 0 }, 20)).toBe(true)
    expect(canRequestPayout({ available: 20, maturing: 0, requested: 0, paid: 0 }, 20)).toBe(true)
    expect(canRequestPayout({ available: 19.99, maturing: 0, requested: 0, paid: 0 }, 20)).toBe(false)
  })
})
