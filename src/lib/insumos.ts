// Camada de dados dos insumos: chamadas supabase-js puras, sem estado de UI.
// O cache/estado fica em src/hooks/useInsumos.ts (TanStack Query).
import { supabase } from './supabase'
import { custoPorUnidade } from './calculos'
import { formatarDinheiro } from './formato'
import type { Insumo, Unidade } from './tipos'

export type NovoInsumo = {
  nome: string
  preco_pago: number
  quantidade_comprada: number
  unidade: Unidade
  fator_rendimento: number
}

export async function listarInsumos(): Promise<Insumo[]> {
  const { data, error } = await supabase.from('insumos').select('*').order('nome')
  if (error) throw error
  return data
}

export async function criarInsumo(insumo: NovoInsumo): Promise<Insumo> {
  const { data, error } = await supabase.from('insumos').insert(insumo).select().single()
  if (error) throw error
  return data
}

export async function atualizarInsumo(
  id: string,
  campos: Partial<NovoInsumo>
): Promise<Insumo> {
  const { data, error } = await supabase
    .from('insumos')
    .update(campos)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function arquivarInsumo(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('insumos').update({ ativo }).eq('id', id)
  if (error) throw error
}

export async function excluirInsumo(id: string): Promise<void> {
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw error
}

export async function registrarCompra(
  id: string,
  precoPago: number,
  quantidadeComprada: number
): Promise<void> {
  const { error } = await supabase
    .from('insumos')
    .update({ preco_pago: precoPago, quantidade_comprada: quantidadeComprada })
    .eq('id', id)
  if (error) throw error
}

/** true se algum item de ficha técnica usa esse insumo (impede exclusão de vez). */
export async function insumoEmUso(id: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('itens_ficha')
    .select('id', { count: 'exact', head: true })
    .eq('insumo_id', id)
  if (error) throw error
  return (count ?? 0) > 0
}

/**
 * "R$ 35,00/kg" — custo legível do insumo. Exibe por kg/L quando a unidade é
 * g/ml e a quantidade comprada foi de 1000 ou mais (compra em kg/L inteiro).
 */
export function formatarCustoLegivel(insumo: Insumo): string {
  const custoBase = custoPorUnidade(insumo.preco_pago, insumo.quantidade_comprada)
  if (insumo.unidade !== 'un' && insumo.quantidade_comprada >= 1000) {
    const unidadeGrande = insumo.unidade === 'g' ? 'kg' : 'L'
    return `${formatarDinheiro(custoBase * 1000)}/${unidadeGrande}`
  }
  return `${formatarDinheiro(custoBase)}/${insumo.unidade}`
}
