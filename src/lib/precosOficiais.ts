// Camada de dados dos preços oficiais (escolhidos pelo dono, por prato+canal).
import { supabase } from './supabase'
import type { PrecoOficial } from './tipos'

export async function listarPrecosOficiais(): Promise<PrecoOficial[]> {
  const { data, error } = await supabase.from('precos_oficiais').select('*')
  if (error) throw error
  return data
}

/** Define/atualiza o preço oficial de um prato num canal (upsert pela unique). */
export async function definirPrecoOficial(
  pratoId: string,
  canalId: string,
  preco: number
): Promise<void> {
  const { error } = await supabase
    .from('precos_oficiais')
    .upsert(
      { prato_id: pratoId, canal_id: canalId, preco },
      { onConflict: 'prato_id,canal_id' }
    )
  if (error) throw error
}

/** Volta o prato+canal a usar o preço sugerido (remove o oficial). */
export async function removerPrecoOficial(pratoId: string, canalId: string): Promise<void> {
  const { error } = await supabase
    .from('precos_oficiais')
    .delete()
    .eq('prato_id', pratoId)
    .eq('canal_id', canalId)
  if (error) throw error
}
