// Camada de dados dos pratos e itens de ficha: chamadas supabase-js puras.
// Cache/estado em src/hooks/usePratos.ts; fórmulas em calculos.ts.
import { supabase } from './supabase'
import type { ItemFicha, Prato } from './tipos'

export type NovoPrato = {
  nome: string
  categoria: string | null
  foto_url: string | null
  rende_porcoes: number
  margem_alvo_pct: number | null
}

export type PratoComItens = Prato & { itens_ficha: ItemFicha[] }

export async function listarPratos(): Promise<PratoComItens[]> {
  const { data, error } = await supabase
    .from('pratos')
    .select('*, itens_ficha(*)')
    .order('nome')
  if (error) throw error
  return data
}

export async function buscarPrato(id: string): Promise<PratoComItens> {
  const { data, error } = await supabase
    .from('pratos')
    .select('*, itens_ficha(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function criarPrato(prato: NovoPrato): Promise<Prato> {
  const { data, error } = await supabase.from('pratos').insert(prato).select().single()
  if (error) throw error
  return data
}

export async function atualizarPrato(
  id: string,
  campos: Partial<NovoPrato>
): Promise<Prato> {
  const { data, error } = await supabase
    .from('pratos')
    .update(campos)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function arquivarPrato(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('pratos').update({ ativo }).eq('id', id)
  if (error) throw error
}

// --- Itens da ficha (upsert pela unique prato_id+insumo_id) ---

export async function salvarItemFicha(
  pratoId: string,
  insumoId: string,
  quantidadePronta: number
): Promise<void> {
  const { error } = await supabase
    .from('itens_ficha')
    .upsert(
      { prato_id: pratoId, insumo_id: insumoId, quantidade_pronta: quantidadePronta },
      { onConflict: 'prato_id,insumo_id' }
    )
  if (error) throw error
}

export async function removerItemFicha(pratoId: string, insumoId: string): Promise<void> {
  const { error } = await supabase
    .from('itens_ficha')
    .delete()
    .eq('prato_id', pratoId)
    .eq('insumo_id', insumoId)
  if (error) throw error
}

/** Categorias distintas já usadas (para o select com criação livre). */
export async function listarCategorias(): Promise<string[]> {
  const { data, error } = await supabase
    .from('pratos')
    .select('categoria')
    .not('categoria', 'is', null)
  if (error) throw error
  const nomes = data.map((linha) => linha.categoria as string)
  return [...new Set(nomes)].sort()
}
