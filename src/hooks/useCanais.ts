// Estado/cache dos canais de venda via TanStack Query. Camada de dados pura
// fica em src/lib/canais.ts — este arquivo só liga ela ao React.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as canaisApi from '@/lib/canais'
import type { NovoCanal } from '@/lib/canais'

const CHAVE_CANAIS = ['canais']

export function useCanais() {
  return useQuery({ queryKey: CHAVE_CANAIS, queryFn: canaisApi.listarCanais })
}

export function useCanalEmUso(id: string | undefined, habilitado: boolean) {
  return useQuery({
    queryKey: ['canais', id, 'em-uso'],
    queryFn: () => canaisApi.canalEmUso(id as string),
    enabled: habilitado && id !== undefined,
  })
}

export function useCriarCanal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NovoCanal) => canaisApi.criarCanal(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CANAIS }),
  })
}

export function useAtualizarCanal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, campos }: { id: string; campos: Partial<NovoCanal> }) =>
      canaisApi.atualizarCanal(id, campos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CANAIS }),
  })
}

export function useArquivarCanal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      canaisApi.arquivarCanal(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CANAIS }),
  })
}

export function useExcluirCanal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => canaisApi.excluirCanal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CANAIS }),
  })
}
