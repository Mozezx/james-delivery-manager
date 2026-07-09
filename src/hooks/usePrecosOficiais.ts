// Estado/cache dos preços oficiais via TanStack Query.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/precosOficiais'

const CHAVE = ['precos-oficiais']

export function usePrecosOficiais() {
  return useQuery({ queryKey: CHAVE, queryFn: api.listarPrecosOficiais })
}

export function useDefinirPrecoOficial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pratoId,
      canalId,
      preco,
    }: {
      pratoId: string
      canalId: string
      preco: number
    }) => api.definirPrecoOficial(pratoId, canalId, preco),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}

export function useRemoverPrecoOficial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pratoId, canalId }: { pratoId: string; canalId: string }) =>
      api.removerPrecoOficial(pratoId, canalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
