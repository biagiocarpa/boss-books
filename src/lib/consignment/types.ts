/** Uno scaglione di prezzo: la % che il boss trattiene per libri fino a `maxPrice`. */
export interface CommissionTier {
  /** Prezzo massimo (incluso) della fascia; null = fascia superiore senza limite. */
  maxPrice: number | null
  /** Percentuale trattenuta dal boss (es. 60 = 60%). */
  sellerPercent: number
}

/** Parametri di business, provenienti dalla tabella `impostazioni`. */
export interface BusinessSettings {
  /** Commissione eBay in percentuale (es. 5 = 5%). */
  ebayCommissionPercent: number
  /** Scaglioni ordinati per maxPrice crescente; l'ultimo ha maxPrice = null. */
  tiers: CommissionTier[]
  /** Giorni di maturazione dalla data di vendita. */
  maturationDays: number
  /** Cifra minima richiedibile in euro. */
  minWithdrawal: number
}

/** Scomposizione del ricavo di un libro venduto. */
export interface Breakdown {
  /** Prezzo di vendita al netto della commissione eBay. */
  net: number
  /** Quota trattenuta dal boss. */
  sellerCut: number
  /** Quota spettante al cliente. */
  clientAmount: number
}
