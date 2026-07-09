// Fórmulas de negócio puras (sem I/O, sem estado). Todo cálculo do domínio
// mora aqui, com testes ao lado — ver calculos.test.ts.
// Fase 3 (insumos): custo por unidade e fator de rendimento medido.
// Fichas técnicas e preço por canal chegam nas fases seguintes.

/**
 * Custo por unidade base (g, ml ou un) CRUA, a partir do preço pago e da
 * quantidade comprada nessa mesma unidade.
 * Ex.: R$ 5,00 pagos em 1000g → 0,005/g.
 */
export function custoPorUnidade(precoPago: number, quantidadeComprada: number): number {
  if (quantidadeComprada <= 0) return 0
  return precoPago / quantidadeComprada
}

/**
 * Fator de rendimento a partir da medição assistida: pesou cru, rendeu
 * pronto. Ex.: 200g cru → 140g pronto = fator 0.7 (a carne encolhe).
 * 100g cru → 220g pronto = fator 2.2 (o arroz cresce).
 */
export function calcularFatorRendimento(pesoCru: number, pesoPronto: number): number {
  if (pesoCru <= 0) return 0
  return pesoPronto / pesoCru
}

// ---------- Fase 4: ficha técnica ----------

/** O que a fórmula precisa saber de um insumo (subconjunto de Insumo). */
export type InsumoParaCusto = {
  preco_pago: number
  quantidade_comprada: number
  fator_rendimento: number
}

/**
 * Quantidade CRUA necessária para obter a quantidade pronta no prato.
 * Regra central do CLAUDE.md: cru = pronto ÷ fator.
 * Ex.: 150g de carne pronta, fator 0.7 → ~214,3g crua.
 */
export function quantidadeCrua(quantidadePronta: number, fatorRendimento: number): number {
  if (fatorRendimento <= 0) return 0
  return quantidadePronta / fatorRendimento
}

/**
 * Custo de UM item da ficha: converte a quantidade pronta para crua e
 * multiplica pelo custo unitário cru.
 * Ex. de referência: 150g de carne pronta, fator 0.7, R$ 35/kg → R$ 7,50.
 */
export function custoItemFicha(quantidadePronta: number, insumo: InsumoParaCusto): number {
  return (
    quantidadeCrua(quantidadePronta, insumo.fator_rendimento) *
    custoPorUnidade(insumo.preco_pago, insumo.quantidade_comprada)
  )
}

/**
 * Custo direto do LOTE inteiro: soma dos custos dos itens.
 * As quantidades da ficha são sempre do lote (modelo unificado);
 * ficha por porção é só o lote com rende_porcoes = 1.
 */
export function custoDireto(
  itens: { quantidade_pronta: number; insumo: InsumoParaCusto }[]
): number {
  return itens.reduce(
    (soma, item) => soma + custoItemFicha(item.quantidade_pronta, item.insumo),
    0
  )
}

/**
 * Custo por porção = custo do lote ÷ rende_porcoes.
 * Exemplo de referência: Marmita Padrão (rende 1) ≈ R$ 8,34.
 */
export function custoPorPorcao(
  itens: { quantidade_pronta: number; insumo: InsumoParaCusto }[],
  rendePorcoes: number
): number {
  if (rendePorcoes <= 0) return 0
  return custoDireto(itens) / rendePorcoes
}

// ---------- Fase 5: rateio de custos fixos ----------

/**
 * Custo fixo rateado por marmita = total mensal ÷ (vendas/dia × dias/mês).
 * Exemplo de referência: 1025 ÷ (10 × 20) = R$ 5,13 (aprox.).
 */
export function custoFixoPorMarmita(
  totalMensal: number,
  vendasEstimadasDia: number,
  diasTrabalhadosMes: number
): number {
  const marmitasMes = vendasEstimadasDia * diasTrabalhadosMes
  if (marmitasMes <= 0) return 0
  return totalMensal / marmitasMes
}

// ---------- Fase 6: precificação por canal ----------
// Convenção: percentuais entram como PCT (25 = 25%), igual ao banco
// (comissao_pct, margem_alvo_pct). Margem efetiva SAI como fração (0.3)
// para casar com <Percentual>.

/**
 * Preço sugerido = custo_total ÷ (1 − comissão% − taxa% − margem%).
 * Retorna null quando comissão + taxa + margem ≥ 100% (impossível —
 * a tela mostra erro claro, nunca um número quebrado).
 * Exemplo de referência: 13,47 ÷ (1 − 0,25 − 0 − 0,30) ≈ 29,93.
 */
export function precoSugerido(
  custoTotal: number,
  comissaoPct: number,
  taxaPagamentoPct: number,
  margemPct: number
): number | null {
  const denominador = 1 - (comissaoPct + taxaPagamentoPct + margemPct) / 100
  if (denominador <= 0) return null
  return custoTotal / denominador
}

/** Comissões do canal em R$ sobre um preço (comissão + taxa de pagamento). */
export function comissaoEmReais(
  preco: number,
  comissaoPct: number,
  taxaPagamentoPct: number
): number {
  return (preco * (comissaoPct + taxaPagamentoPct)) / 100
}

/** Lucro em R$ por unidade vendida a um preço num canal. */
export function lucroPorUnidade(
  preco: number,
  custoTotal: number,
  comissaoPct: number,
  taxaPagamentoPct: number
): number {
  return preco - comissaoEmReais(preco, comissaoPct, taxaPagamentoPct) - custoTotal
}

/**
 * Margem efetiva (FRAÇÃO do preço: 0.3 = 30%) de um preço praticado.
 * Preço ≤ 0 → 0 (sem divisão por zero).
 */
export function margemEfetiva(
  preco: number,
  custoTotal: number,
  comissaoPct: number,
  taxaPagamentoPct: number
): number {
  if (preco <= 0) return 0
  return lucroPorUnidade(preco, custoTotal, comissaoPct, taxaPagamentoPct) / preco
}

/**
 * Arredondamento psicológico do plano-06: o MENOR valor ≥ preço com final
 * ,90 ou ,00. Ex.: 19,25 → 19,90 · 19,91 → 20,00 · 19,90 → 19,90.
 */
export function arredondarPsicologico(preco: number): number {
  if (preco <= 0) return 0
  const base = Math.floor(preco)
  const candidato90 = base + 0.9
  const candidatoInteiro = preco <= base ? base : base + 1
  const menor = preco <= candidato90 ? Math.min(candidato90, candidatoInteiro) : candidatoInteiro
  return Math.round(menor * 100) / 100
}

/**
 * Preços "psicológicos" próximos: candidatos com final ,90 e ,00 em volta
 * do preço sugerido (abaixo e acima), únicos, positivos e ordenados.
 * Ex.: 19,25 → [18,90, 19,00, 19,90, 20,00].
 */
export function precosPsicologicos(preco: number): number[] {
  if (preco <= 0) return []
  const base = Math.floor(preco)
  const candidatos = [base - 1 + 0.9, base, base + 0.9, base + 1]
  return [...new Set(candidatos)]
    .filter((valor) => valor > 0)
    .map((valor) => Math.round(valor * 100) / 100)
    .sort((a, b) => a - b)
}
