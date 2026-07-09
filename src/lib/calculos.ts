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
