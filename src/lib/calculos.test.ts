import { describe, expect, it } from 'vitest'
import {
  calcularFatorRendimento,
  comissaoEmReais,
  custoDireto,
  custoFixoPorMarmita,
  custoItemFicha,
  custoPorPorcao,
  custoPorUnidade,
  lucroPorUnidade,
  margemEfetiva,
  precoSugerido,
  precosPsicologicos,
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

// ---------- Fase 5: rateio de custos fixos ----------

describe('custoFixoPorMarmita', () => {
  it('exemplo de referência: 1025 ÷ (10 × 20) ≈ R$ 5,125', () => {
    expect(custoFixoPorMarmita(1025, 10, 20)).toBeCloseTo(5.125, 3)
  })

  it('retorna 0 quando vendas estimadas/dia é 0', () => {
    expect(custoFixoPorMarmita(1025, 0, 20)).toBe(0)
  })

  it('retorna 0 quando dias trabalhados/mês é 0', () => {
    expect(custoFixoPorMarmita(1025, 10, 0)).toBe(0)
  })
})

// ---------- Fase 6: precificação por canal ----------
// Custo total de referência (CLAUDE.md): R$ 13,47 (8,34 direto + 5,13 rateio).

describe('precoSugerido', () => {
  it('venda direta (sem comissão nem taxa), margem 30% → ≈ R$ 19,2428 (exibição arredonda p/ 19,25)', () => {
    expect(precoSugerido(13.47, 0, 0, 30)).toBeCloseTo(19.24, 2)
  })

  it('iFood (comissão 25%), margem 30% → ≈ R$ 29,933', () => {
    expect(precoSugerido(13.47, 25, 0, 30)).toBeCloseTo(29.93, 2)
  })

  it('retorna null quando comissão + taxa + margem = 100% (denominador zero)', () => {
    expect(precoSugerido(13.47, 25, 0, 75)).toBeNull()
  })

  it('retorna null quando comissão + taxa + margem > 100%', () => {
    expect(precoSugerido(13.47, 50, 30, 40)).toBeNull()
  })
})

describe('comissaoEmReais', () => {
  it('R$ 29,93 a 25% comissão + 0% taxa ≈ R$ 7,4825', () => {
    expect(comissaoEmReais(29.93, 25, 0)).toBeCloseTo(7.4825, 4)
  })
})

describe('lucroPorUnidade', () => {
  it('venda direta: preço 19,25, custo 13,47, sem comissão/taxa ≈ R$ 5,78', () => {
    expect(lucroPorUnidade(19.25, 13.47, 0, 0)).toBeCloseTo(5.78, 2)
  })

  it('iFood: preço 29,93, custo 13,47, comissão 25% ≈ R$ 8,9775', () => {
    expect(lucroPorUnidade(29.93, 13.47, 25, 0)).toBeCloseTo(8.98, 2)
  })
})

describe('margemEfetiva', () => {
  it('venda direta: preço 19,25, custo 13,47 → fração ≈ 0,3003', () => {
    expect(margemEfetiva(19.25, 13.47, 0, 0)).toBeCloseTo(0.3003, 3)
  })

  it('retorna 0 quando o preço é 0 (sem divisão por zero)', () => {
    expect(margemEfetiva(0, 13.47, 0, 0)).toBe(0)
  })

  it('retorna margem negativa quando o custo supera o preço', () => {
    expect(margemEfetiva(10, 13.47, 0, 0)).toBeLessThan(0)
  })
})

describe('precosPsicologicos', () => {
  it('19,25 → [18,90, 19,00, 19,90, 20,00]', () => {
    expect(precosPsicologicos(19.25)).toEqual([18.9, 19, 19.9, 20])
  })

  it('19,00 inclui 18,90 e 19,90 sem duplicar 19,00', () => {
    const resultado = precosPsicologicos(19.0)
    expect(resultado).toContain(18.9)
    expect(resultado).toContain(19.9)
    expect(resultado.filter((valor) => valor === 19).length).toBe(1)
  })

  it('retorna [] para preço 0', () => {
    expect(precosPsicologicos(0)).toEqual([])
  })

  it('retorna [] para preço negativo', () => {
    expect(precosPsicologicos(-5)).toEqual([])
  })
})

describe('consistência preço sugerido × margem efetiva', () => {
  it('o preço sugerido para 30% de margem, ao ser recalculado, produz margem efetiva ≈ 30%', () => {
    const preco = precoSugerido(13.47, 25, 0, 30)
    expect(preco).not.toBeNull()
    expect(margemEfetiva(preco as number, 13.47, 25, 0)).toBeCloseTo(0.3, 2)
  })
})
