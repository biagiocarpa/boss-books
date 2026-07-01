import { describe, it, expect } from 'vitest'
import { isValidClientId, generateClientId, buildSku } from './id'

describe('isValidClientId', () => {
  it('accetta esattamente 8 cifre', () => {
    expect(isValidClientId('00000001')).toBe(true)
    expect(isValidClientId('12345678')).toBe(true)
  })
  it('rifiuta lunghezze diverse o non-cifre', () => {
    expect(isValidClientId('1234567')).toBe(false)
    expect(isValidClientId('123456789')).toBe(false)
    expect(isValidClientId('1234567a')).toBe(false)
  })
})

describe('generateClientId', () => {
  it('produce 8 cifre a partire da rng', () => {
    // rng costante 0 → tutte le cifre 0
    expect(generateClientId(() => 0, new Set())).toBe('00000000')
  })
  it('evita collisioni con quelli esistenti', () => {
    // primo rng dà '00000000' (già preso), poi cambia
    const seq = [0, 0.999999999] // 0000..., poi 9999...
    let i = 0
    const rng = () => seq[i++]
    expect(generateClientId(rng, new Set(['00000000']))).toBe('99999999')
  })
})

describe('buildSku', () => {
  it('concatena prefisso cliente + suffisso a 8 cifre', () => {
    expect(buildSku('11223344', 1)).toBe('1122334400000001')
    expect(buildSku('11223344', 42)).toBe('1122334400000042')
  })
})
