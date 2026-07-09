import { describe, expect, it } from 'vitest'
import { lerDecimal } from './formato'

describe('lerDecimal', () => {
  it.each([
    ['35,50', 35.5],
    ['35.50', 35.5],
    ['1.234,56', 1234.56],
    ['1.025', 1025],
    ['150', 150],
  ])('lê "%s" como %f', (entrada, esperado) => {
    expect(lerDecimal(entrada)).toBe(esperado)
  })

  it.each([[''], ['abc'], ['1e5']])('retorna null para "%s"', (entrada) => {
    expect(lerDecimal(entrada)).toBeNull()
  })
})
