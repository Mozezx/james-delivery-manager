// Camada de dados dos custos fixos: chamadas supabase-js puras, sem estado
// de UI. O cache/estado fica em src/hooks/useCustosFixos.ts (TanStack Query).
import { supabase } from './supabase'
import type { CustoFixo } from './tipos'

export type NovoCustoFixo = {
  nome: string
  valor_mensal: number
}

export async function listarCustosFixos(): Promise<CustoFixo[]> {
  const { data, error } = await supabase.from('custos_fixos').select('*').order('nome')
  if (error) throw error
  return data
}

export async function criarCustoFixo(custo: NovoCustoFixo): Promise<CustoFixo> {
  const { data, error } = await supabase.from('custos_fixos').insert(custo).select().single()
  if (error) throw error
  return data
}

export async function atualizarCustoFixo(
  id: string,
  campos: Partial<NovoCustoFixo>
): Promise<CustoFixo> {
  const { data, error } = await supabase
    .from('custos_fixos')
    .update(campos)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function arquivarCustoFixo(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('custos_fixos').update({ ativo }).eq('id', id)
  if (error) throw error
}

export async function excluirCustoFixo(id: string): Promise<void> {
  const { error } = await supabase.from('custos_fixos').delete().eq('id', id)
  if (error) throw error
}
