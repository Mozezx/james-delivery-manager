import { describe, expect, it } from 'vitest'
import {
  calcularFatorRendimento,
  custoDireto,
  custoItemFicha,
  custoPorPorcao,
  custoPorUnidade,
  quantidadeCrua,
  type InsumoParaCusto,
} from './calculos'

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

// ---------- Fase 4: ficha técnica ----------
// Exemplo de referência (Marmita Padrão) — ver CLAUDE.md.

const arroz: InsumoParaCusto = {
  preco_pago: 5,
  quantidade_comprada: 1000,
  fator_rendimento: 2.2,
}

const carne: InsumoParaCusto = {
  preco_pago: 35,
  quantidade_comprada: 1000,
  fator_rendimento: 0.7,
}

const embalagem: InsumoParaCusto = {
  preco_pago: 50,
  quantidade_comprada: 100,
  fator_rendimento: 1,
}

describe('quantidadeCrua', () => {
  it('150g pronto, fator 0.7 (carne) → ≈214,29g cru', () => {
    expect(quantidadeCrua(150, 0.7)).toBeCloseTo(214.29, 2)
  })

  it('150g pronto, fator 2.2 (arroz) → ≈68,18g cru', () => {
    expect(quantidadeCrua(150, 2.2)).toBeCloseTo(68.18, 2)
  })

  it('retorna 0 quando o fator de rendimento é 0', () => {
    expect(quantidadeCrua(150, 0)).toBe(0)
  })
})

describe('custoItemFicha — exemplo de referência por item', () => {
  it('arroz: 150g pronto, fator 2.2, R$ 5,00/1000g → ≈ R$ 0,34', () => {
    expect(custoItemFicha(150, arroz)).toBeCloseTo(0.34, 2)
  })

  it('carne: 150g pronta, fator 0.7, R$ 35,00/1000g → R$ 7,50', () => {
    expect(custoItemFicha(150, carne)).toBeCloseTo(7.5, 2)
  })

  it('embalagem: 1un, fator 1, R$ 50,00/100un → R$ 0,50', () => {
    expect(custoItemFicha(1, embalagem)).toBeCloseTo(0.5, 2)
  })
})

describe('custoDireto', () => {
  it('Marmita Padrão (arroz + carne + embalagem) ≈ R$ 8,34', () => {
    const itens = [
      { quantidade_pronta: 150, insumo: arroz },
      { quantidade_pronta: 150, insumo: carne },
      { quantidade_pronta: 1, insumo: embalagem },
    ]
    expect(custoDireto(itens)).toBeCloseTo(8.34, 2)
  })

  it('retorna 0 para uma lista vazia de itens', () => {
    expect(custoDireto([])).toBe(0)
  })
})

describe('custoPorPorcao', () => {
  it('rende 1 porção → mesmo custo direto (≈ R$ 8,34)', () => {
    const itens = [
      { quantidade_pronta: 150, insumo: arroz },
      { quantidade_pronta: 150, insumo: carne },
      { quantidade_pronta: 1, insumo: embalagem },
    ]
    expect(custoPorPorcao(itens, 1)).toBeCloseTo(8.34, 2)
  })

  it('caso panela: quantidades ×8, rende 8 porções → mesmo custo por porção (≈ R$ 8,34)', () => {
    const itensPanela = [
      { quantidade_pronta: 150 * 8, insumo: arroz },
      { quantidade_pronta: 150 * 8, insumo: carne },
      { quantidade_pronta: 1 * 8, insumo: embalagem },
    ]
    expect(custoPorPorcao(itensPanela, 8)).toBeCloseTo(8.34, 2)
  })

  it('retorna 0 quando rendePorcoes é 0 (guarda contra divisão por zero)', () => {
    const itens = [{ quantidade_pronta: 150, insumo: arroz }]
    expect(custoPorPorcao(itens, 0)).toBe(0)
  })
})
