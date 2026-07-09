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
