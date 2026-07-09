// Camada de dados das vendas diárias: chamadas supabase-js puras, sem estado
// de UI. Cache/estado em src/hooks/useVendas.ts (TanStack Query).
import { supabase } from './supabase'
import type { Venda } from './tipos'

export type NovaVenda = {
  data: string // "YYYY-MM-DD", sempre local — ver src/lib/datas.ts
  prato_id: string
  canal_id: string
  quantidade: number
}

/** Vendas lançadas num único dia — a grade de lançamento. */
export async function listarVendasDoDia(data: string): Promise<Venda[]> {
  const { data: linhas, error } = await supabase.from('vendas').select('*').eq('data', data)
  if (error) throw error
  return linhas
}

/** Vendas lançadas num período [inicio, fim] inclusive — a visão do mês. */
export async function listarVendasDoPeriodo(inicio: string, fim: string): Promise<Venda[]> {
  const { data: linhas, error } = await supabase
    .from('vendas')
    .select('*')
    .gte('data', inicio)
    .lte('data', fim)
  if (error) throw error
  return linhas
}

/**
 * Upsert por dia/prato/canal (unique já existe no banco). Quantidade 0 ou
 * menor apaga a linha em vez de salvar — o banco também tem
 * `check (quantidade > 0)`, então gravar 0 direto violaria a constraint.
 */
export async function upsertVenda(venda: NovaVenda): Promise<void> {
  if (venda.quantidade <= 0) {
    const { error } = await supabase
      .from('vendas')
      .delete()
      .eq('data', venda.data)
      .eq('prato_id', venda.prato_id)
      .eq('canal_id', venda.canal_id)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from('vendas')
    .upsert(venda, { onConflict: 'data,prato_id,canal_id' })
  if (error) throw error
}
