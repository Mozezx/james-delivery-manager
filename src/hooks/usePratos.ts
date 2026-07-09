// Estado/cache dos pratos via TanStack Query (mesmo padrão de useInsumos).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as pratosApi from '@/lib/pratos'
import type { NovoPrato } from '@/lib/pratos'

const CHAVE_PRATOS = ['pratos']

export function usePratos() {
  return useQuery({ queryKey: CHAVE_PRATOS, queryFn: pratosApi.listarPratos })
}

export function usePrato(id: string | undefined) {
  return useQuery({
    queryKey: ['pratos', id],
    queryFn: () => pratosApi.buscarPrato(id as string),
    enabled: id !== undefined,
  })
}

export function useCategorias() {
  return useQuery({ queryKey: ['pratos', 'categorias'], queryFn: pratosApi.listarCategorias })
}

export function useCriarPrato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NovoPrato) => pratosApi.criarPrato(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_PRATOS }),
  })
}

export function useAtualizarPrato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, campos }: { id: string; campos: Partial<NovoPrato> }) =>
      pratosApi.atualizarPrato(id, campos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_PRATOS }),
  })
}

export function useArquivarPrato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      pratosApi.arquivarPrato(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_PRATOS }),
  })
}

export function useSalvarItemFicha() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pratoId,
      insumoId,
      quantidadePronta,
    }: {
      pratoId: string
      insumoId: string
      quantidadePronta: number
    }) => pratosApi.salvarItemFicha(pratoId, insumoId, quantidadePronta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_PRATOS }),
  })
}

export function useRemoverItemFicha() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pratoId, insumoId }: { pratoId: string; insumoId: string }) =>
      pratosApi.removerItemFicha(pratoId, insumoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_PRATOS }),
  })
}
