// Datas em "YYYY-MM-DD", SEMPRE no fuso local (regra do CLAUDE.md: nunca
// toISOString() — ele converte para UTC e erra o dia à noite no Brasil).
// new Date("YYYY-MM-DD") também é UTC (spec do JS) — por isso os helpers
// abaixo sempre montam a data com new Date(ano, mes, dia), nunca parseando
// a string ISO direto.

/** "YYYY-MM-DD" de um Date, sempre no fuso local (não usa toISOString). */
export function paraISOLocal(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Hoje, local, como "YYYY-MM-DD". */
export function hojeISO(): string {
  return paraISOLocal(new Date())
}

/** Parseia "YYYY-MM-DD" como Date LOCAL (meia-noite local, não UTC). */
export function paraDataLocal(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

/** Soma (ou subtrai, com número negativo) dias a uma data "YYYY-MM-DD". */
export function somarDias(iso: string, dias: number): string {
  const data = paraDataLocal(iso)
  data.setDate(data.getDate() + dias)
  return paraISOLocal(data)
}

/** Primeiro dia do mês da data informada, como "YYYY-MM-DD". */
export function inicioDoMes(iso: string): string {
  const [ano, mes] = iso.split('-')
  return `${ano}-${mes}-01`
}

/** Último dia do mês da data informada, como "YYYY-MM-DD". */
export function fimDoMes(iso: string): string {
  const [ano, mes] = iso.split('-').map(Number)
  const ultimoDia = new Date(ano, mes, 0).getDate() // dia 0 do mês seguinte = último dia deste
  return `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
}

/** Soma (ou subtrai) meses a uma data "YYYY-MM-DD", sempre voltando ao dia 1. */
export function somarMeses(iso: string, meses: number): string {
  const [ano, mes] = iso.split('-').map(Number)
  return paraISOLocal(new Date(ano, mes - 1 + meses, 1))
}

/** "8 de julho de 2026" a partir de "YYYY-MM-DD". */
export function formatarDataLegivel(iso: string): string {
  return paraDataLocal(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

/** "julho de 2026" a partir de qualquer data "YYYY-MM-DD" do mês. */
export function nomeDoMes(iso: string): string {
  return paraDataLocal(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
