// Estado/cache da config (linha única) via TanStack Query. Camada de dados
// pura fica em src/lib/config.ts — este arquivo só liga ela ao React.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as configApi from '@/lib/config'
import type { CamposConfig } from '@/lib/config'

const CHAVE_CONFIG = ['config']

export function useConfig() {
  return useQuery({ queryKey: CHAVE_CONFIG, queryFn: configApi.buscarConfig })
}

export function useAtualizarConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campos: CamposConfig) => configApi.atualizarConfig(campos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CONFIG }),
  })
}
