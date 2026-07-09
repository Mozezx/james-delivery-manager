import { describe, expect, it } from 'vitest'
import {
  fimDoMes,
  inicioDoMes,
  paraDataLocal,
  paraISOLocal,
  somarDias,
  somarMeses,
} from './datas'

describe('paraISOLocal / paraDataLocal', () => {
  it('ida e volta preserva a data local', () => {
    expect(paraISOLocal(paraDataLocal('2026-07-08'))).toBe('2026-07-08')
    expect(paraISOLocal(paraDataLocal('2026-01-01'))).toBe('2026-01-01')
    expect(paraISOLocal(paraDataLocal('2026-12-31'))).toBe('2026-12-31')
  })

  it('parseia como meia-noite LOCAL, não UTC', () => {
    const data = paraDataLocal('2026-07-08')
    expect(data.getHours()).toBe(0)
    expect(data.getDate()).toBe(8)
  })
})

describe('somarDias', () => {
  it('atravessa a virada de mês', () => {
    expect(somarDias('2026-07-31', 1)).toBe('2026-08-01')
    expect(somarDias('2026-08-01', -1)).toBe('2026-07-31')
  })

  it('atravessa a virada de ano', () => {
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(somarDias('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('fevereiro em ano bissexto (2028) e comum (2026)', () => {
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(somarDias('2026-02-28', 1)).toBe('2026-03-01')
  })
})

describe('inicioDoMes / fimDoMes', () => {
  it('meses de 31, 30 e 28/29 dias', () => {
    expect(inicioDoMes('2026-07-08')).toBe('2026-07-01')
    expect(fimDoMes('2026-07-08')).toBe('2026-07-31')
    expect(fimDoMes('2026-06-15')).toBe('2026-06-30')
    expect(fimDoMes('2026-02-10')).toBe('2026-02-28')
    expect(fimDoMes('2028-02-10')).toBe('2028-02-29')
  })
})

describe('somarMeses', () => {
  it('sempre ancora no dia 1', () => {
    expect(somarMeses('2026-07-31', 1)).toBe('2026-08-01')
    expect(somarMeses('2026-07-08', -1)).toBe('2026-06-01')
  })

  it('atravessa a virada de ano nos dois sentidos', () => {
    expect(somarMeses('2026-12-01', 1)).toBe('2027-01-01')
    expect(somarMeses('2026-01-01', -1)).toBe('2025-12-01')
  })

  it('janeiro + 1 não pula fevereiro (âncora no dia 1 evita o bug do dia 31)', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-01')
  })
})
