import { roundCents } from './calculate'

export type SoldBookStatus = 'venduto' | 'reso' | 'pagato'

/** Un libro venduto rilevante per il conto del cliente. */
export interface SoldBook {
  /** Quota spettante al cliente per questo libro (già calcolata). */
  clientAmount: number
  /** Data di vendita. */
  saleDate: Date
  /** Stato ai fini del conto. */
  status: SoldBookStatus
}

export interface Balance {
  /** Maturato e non ancora pagato: cifra richiedibile. */
  available: number
  /** Venduto ma ancora dentro la finestra di maturazione. */
  maturing: number
  /** Già liquidato al cliente. */
  paid: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** True se sono trascorsi almeno `maturationDays` dalla vendita. */
export function isMatured(saleDate: Date, now: Date, maturationDays: number): boolean {
  const elapsedDays = (now.getTime() - saleDate.getTime()) / MS_PER_DAY
  return elapsedDays >= maturationDays
}

/**
 * Aggrega i libri venduti di un cliente in {disponibile, in maturazione, pagato}.
 * I libri 'reso' sono esclusi dal conto.
 */
export function computeBalance(books: SoldBook[], now: Date, maturationDays: number): Balance {
  let available = 0
  let maturing = 0
  let paid = 0

  for (const book of books) {
    if (book.status === 'reso') continue
    if (book.status === 'pagato') {
      paid += book.clientAmount
    } else if (isMatured(book.saleDate, now, maturationDays)) {
      available += book.clientAmount
    } else {
      maturing += book.clientAmount
    }
  }

  return {
    available: roundCents(available),
    maturing: roundCents(maturing),
    paid: roundCents(paid),
  }
}

/** True se il cliente può richiedere il pagamento (disponibile >= minimo). */
export function canRequestPayout(balance: Balance, minWithdrawal: number): boolean {
  return balance.available >= minWithdrawal
}
