// Camada de dados da config: linha única (id sempre 1) com as estimativas de
// rateio e a margem alvo global. Chamadas supabase-js puras, sem estado de
// UI — o cache/estado fica em src/hooks/useConfig.ts (TanStack Query).
import { supabase } from './supabase'
import type { Config } from './tipos'

export type CamposConfig = Partial<
  Pick<Config, 'vendas_estimadas_dia' | 'dias_trabalhados_mes' | 'margem_alvo_pct'>
>

export async function buscarConfig(): Promise<Config> {
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function atualizarConfig(campos: CamposConfig): Promise<Config> {
  const { data, error } = await supabase
    .from('config')
    .update(campos)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}
