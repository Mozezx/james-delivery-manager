import { describe, expect, it } from 'vitest'
import { calcularFatorRendimento, custoPorUnidade } from './calculos'

describe('custoPorUnidade', () => {
  it('R$ 5,00 por 1000g → 0,005/g', () => {
    expect(custoPorUnidade(5, 1000)).toBeCloseTo(0.005)
  })

  it('R$ 35,00 por 1kg (1000g) → 0,035/g', () => {
    expect(custoPorUnidade(35, 1000)).toBeCloseTo(0.035)
  })

  it('retorna 0 quando a quantidade comprada é zero', () => {
    expect(custoPorUnidade(10, 0)).toBe(0)
  })

  it('retorna 0 quando a quantidade comprada é negativa', () => {
    expect(custoPorUnidade(10, -5)).toBe(0)
  })
})

describe('calcularFatorRendimento', () => {
  it('200g cru / 140g pronto = fator 0.7 (encolhe)', () => {
    expect(calcularFatorRendimento(200, 140)).toBeCloseTo(0.7)
  })

  it('100g cru / 220g pronto = fator 2.2 (cresce, ex. arroz)', () => {
    expect(calcularFatorRendimento(100, 220)).toBeCloseTo(2.2)
  })

  it('retorna 0 quando o peso cru é zero', () => {
    expect(calcularFatorRendimento(0, 100)).toBe(0)
  })
})
