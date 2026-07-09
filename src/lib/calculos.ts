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

// ---------- Fase 7: registro de vendas e visão do mês ----------
// Lucro histórico usa custo ATUAL (aproximação consciente — ver CLAUDE.md).
// Quem chama já resolveu, para cada par prato×canal, o preço em uso
// (oficial ?? sugerido) e o lucro por unidade a esse preço — essas funções
// só agregam quantidades vendidas, sem saber de insumos/canais/margens.

/** O que a agregação de vendas precisa saber de uma venda lançada. */
export type VendaParaAgregacao = {
  data: string
  prato_id: string
  canal_id: string
  quantidade: number
}

/** Preço em uso e lucro por unidade já resolvidos para um par prato×canal. */
export type PrecoLucroPar = { preco: number; lucroUnidade: number }

/** Mapa indexado pela chave `${prato_id}:${canal_id}` → preço/lucro do par. */
export type MapaPrecoLucro = Record<string, PrecoLucroPar>

/** Chave estável para indexar um par prato×canal num MapaPrecoLucro. */
export function chaveParPratoCanal(pratoId: string, canalId: string): string {
  return `${pratoId}:${canalId}`
}

/** Total de marmitas vendidas na lista de vendas informada. */
export function totalMarmitas(vendas: VendaParaAgregacao[]): number {
  return vendas.reduce((soma, venda) => soma + venda.quantidade, 0)
}

/** Receita estimada: Σ quantidade × preço em uso do par prato×canal. */
export function receitaEstimada(
  vendas: VendaParaAgregacao[],
  precos: MapaPrecoLucro
): number {
  return vendas.reduce((soma, venda) => {
    const preco = precos[chaveParPratoCanal(venda.prato_id, venda.canal_id)]?.preco ?? 0
    return soma + venda.quantidade * preco
  }, 0)
}

/**
 * Lucro estimado: Σ quantidade × lucro por unidade do par prato×canal.
 * Usa custo ATUAL — aproximação aceita para lucro histórico (CLAUDE.md).
 */
export function lucroEstimado(vendas: VendaParaAgregacao[], precos: MapaPrecoLucro): number {
  return vendas.reduce((soma, venda) => {
    const lucroUnidade =
      precos[chaveParPratoCanal(venda.prato_id, venda.canal_id)]?.lucroUnidade ?? 0
    return soma + venda.quantidade * lucroUnidade
  }, 0)
}

/** Quantidade vendida e lucro estimado agregados de um prato (todos os canais). */
export type RankingPrato = {
  prato_id: string
  quantidade: number
  lucro: number
}

/** Agrega vendas por prato — a base do ranking "mais vendido" × "mais lucrativo". */
export function agregarPorPrato(
  vendas: VendaParaAgregacao[],
  precos: MapaPrecoLucro
): RankingPrato[] {
  const porPrato = new Map<string, RankingPrato>()
  for (const venda of vendas) {
    const lucroUnidade =
      precos[chaveParPratoCanal(venda.prato_id, venda.canal_id)]?.lucroUnidade ?? 0
    const atual = porPrato.get(venda.prato_id) ?? {
      prato_id: venda.prato_id,
      quantidade: 0,
      lucro: 0,
    }
    atual.quantidade += venda.quantidade
    atual.lucro += venda.quantidade * lucroUnidade
    porPrato.set(venda.prato_id, atual)
  }
  return [...porPrato.values()]
}

/** Prato mais vendido por quantidade (não necessariamente o mais lucrativo). */
export function pratoMaisVendido(ranking: RankingPrato[]): RankingPrato | null {
  if (ranking.length === 0) return null
  return ranking.reduce((melhor, atual) => (atual.quantidade > melhor.quantidade ? atual : melhor))
}

/** Prato mais lucrativo (não necessariamente o mais vendido). */
export function pratoMaisLucrativo(ranking: RankingPrato[]): RankingPrato | null {
  if (ranking.length === 0) return null
  return ranking.reduce((melhor, atual) => (atual.lucro > melhor.lucro ? atual : melhor))
}

/** Volume, receita e lucro agregados de um canal (todos os pratos). */
export type ResultadoCanal = {
  canal_id: string
  quantidade: number
  receita: number
  lucro: number
}

/** Agrega vendas por canal — o comparativo Direto × iFood do mês. */
export function agregarPorCanal(
  vendas: VendaParaAgregacao[],
  precos: MapaPrecoLucro
): ResultadoCanal[] {
  const porCanal = new Map<string, ResultadoCanal>()
  for (const venda of vendas) {
    const { preco = 0, lucroUnidade = 0 } =
      precos[chaveParPratoCanal(venda.prato_id, venda.canal_id)] ?? {}
    const atual = porCanal.get(venda.canal_id) ?? {
      canal_id: venda.canal_id,
      quantidade: 0,
      receita: 0,
      lucro: 0,
    }
    atual.quantidade += venda.quantidade
    atual.receita += venda.quantidade * preco
    atual.lucro += venda.quantidade * lucroUnidade
    porCanal.set(venda.canal_id, atual)
  }
  return [...porCanal.values()]
}

/** Quantidade de dias distintos com pelo menos uma venda lançada no período. */
export function diasComVenda(vendas: VendaParaAgregacao[]): number {
  return new Set(vendas.map((venda) => venda.data)).size
}

/**
 * Ritmo mensalizado de vendas: total vendido no mês ÷ dias com venda ×
 * dias trabalhados/mês. Sem nenhum dia com venda ainda → 0 (evita divisão
 * por zero quando o mês está vazio).
 */
export function ritmoMensalizado(
  totalVendidoNoMes: number,
  diasComVendaNoMes: number,
  diasTrabalhadosMes: number
): number {
  if (diasComVendaNoMes <= 0) return 0
  return (totalVendidoNoMes / diasComVendaNoMes) * diasTrabalhadosMes
}

/**
 * true quando um valor real diverge de uma estimativa em mais de
 * `limiarFracao` (padrão 20%) — dispara o banner "usar ritmo real"
 * (aqui e em /custos). Funciona tanto para ritmo/dia quanto para totais
 * mensalizados: a fração de divergência é a mesma nas duas escalas.
 * Exemplo de referência: 200 estimadas / ritmo 120 → diverge (40%).
 */
export function divergeDaEstimativa(
  real: number,
  estimativa: number,
  limiarFracao = 0.2
): boolean {
  if (estimativa <= 0) return false
  return Math.abs(real - estimativa) / estimativa > limiarFracao
}
