/** True se `id` è esattamente 8 cifre. */
export function isValidClientId(id: string): boolean {
  return /^[0-9]{8}$/.test(id)
}

/**
 * Genera un id cliente a 8 cifre casuali non presente in `existing`.
 * `rng` deve restituire un numero in [0,1) (in produzione: Math.random).
 */
export function generateClientId(rng: () => number, existing: ReadonlySet<string>): string {
  for (let attempts = 0; attempts < 10000; attempts++) {
    const n = Math.floor(rng() * 100_000_000) // 0..99_999_999
    const id = String(n).padStart(8, '0')
    if (!existing.has(id)) return id
  }
  throw new Error('Impossibile generare un id cliente univoco')
}

/** Compone lo SKU: prefisso cliente (8 cifre) + suffisso libro (8 cifre zero-padded). */
export function buildSku(clienteId: string, seq: number): string {
  return clienteId + String(seq).padStart(8, '0')
}
