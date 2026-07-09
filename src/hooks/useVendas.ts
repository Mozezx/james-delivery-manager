// Estado/cache das vendas via TanStack Query. Camada de dados pura fica em
// src/lib/vendas.ts — este arquivo só liga ela ao React.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as vendasApi from '@/lib/vendas'
import type { NovaVenda } from '@/lib/vendas'

export function useVendasDoDia(data: string) {
  return useQuery({
    queryKey: ['vendas', 'dia', data],
    queryFn: () => vendasApi.listarVendasDoDia(data),
  })
}

export function useVendasDoPeriodo(inicio: string, fim: string) {
  return useQuery({
    queryKey: ['vendas', 'periodo', inicio, fim],
    queryFn: () => vendasApi.listarVendasDoPeriodo(inicio, fim),
  })
}

/**
 * Upsert de uma venda. A tela já atualiza o contador na hora (estado local
 * otimista) — esta mutation só persiste. Em erro, quem chama decide o
 * feedback (toast) e pode chamar de novo com o mesmo payload.
 */
export function useUpsertVenda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (venda: NovaVenda) => vendasApi.upsertVenda(venda),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas'] }),
  })
}
