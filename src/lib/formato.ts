// Formatação e leitura de números em pt-BR.
// Fórmulas de negócio NÃO moram aqui — vão em calculos.ts (Fase 4+).

const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const formatadorPct = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** R$ 1.234,56 */
export function formatarDinheiro(valor: number): string {
  return formatadorBRL.format(valor)
}

/** 30,0% — recebe fração (0.3) */
export function formatarPercentual(fracao: number): string {
  return formatadorPct.format(fracao)
}

/**
 * Lê um número digitado em pt-BR: aceita vírgula OU ponto como decimal
 * ("35,50", "35.50", "1.234,56") e pontos de milhar ("1.025" → 1025).
 * Retorna null se não for um número. Aceita negativos — quem exige
 * valor positivo (preço, quantidade) valida no formulário.
 */
export function lerDecimal(texto: string): number | null {
  const limpo = texto.trim().replace(/\s|R\$/g, '')
  if (limpo === '') return null

  let normalizado = limpo
  if (limpo.includes(',')) {
    // vírgula é o decimal; pontos são separador de milhar
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // só pontos, em grupos de 3: milhar pt-BR ("1.025" → 1025).
    // "35.50" não casa (grupo de 2) e segue como decimal com ponto.
    normalizado = limpo.replace(/\./g, '')
  }

  // barra "1e5", "0x10", "Infinity" etc. — só dígitos com decimal opcional
  if (!/^-?\d+(\.\d+)?$/.test(normalizado)) return null

  return Number(normalizado)
}
