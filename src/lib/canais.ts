// Camada de dados dos canais de venda: chamadas supabase-js puras, sem
// estado de UI. O cache/estado fica em src/hooks/useCanais.ts (TanStack Query).
import { supabase } from './supabase'
import type { Canal } from './tipos'

export type NovoCanal = {
  nome: string
  comissao_pct: number
  taxa_pagamento_pct: number
}

export async function listarCanais(): Promise<Canal[]> {
  const { data, error } = await supabase.from('canais').select('*').order('nome')
  if (error) throw error
  return data
}

export async function criarCanal(canal: NovoCanal): Promise<Canal> {
  const { data, error } = await supabase.from('canais').insert(canal).select().single()
  if (error) throw error
  return data
}

export async function atualizarCanal(id: string, campos: Partial<NovoCanal>): Promise<Canal> {
  const { data, error } = await supabase
    .from('canais')
    .update(campos)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function arquivarCanal(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('canais').update({ ativo }).eq('id', id)
  if (error) throw error
}

export async function excluirCanal(id: string): Promise<void> {
  const { error } = await supabase.from('canais').delete().eq('id', id)
  if (error) throw error
}

/** true se algum registro de venda usa esse canal (impede exclusão de vez). */
export async function canalEmUso(id: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('vendas')
    .select('id', { count: 'exact', head: true })
    .eq('canal_id', id)
  if (error) throw error
  return (count ?? 0) > 0
}
