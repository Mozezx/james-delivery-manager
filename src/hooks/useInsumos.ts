// Estado/cache dos insumos via TanStack Query. Camada de dados pura fica em
// src/lib/insumos.ts — este arquivo só liga ela ao React (padrão para as
// próximas fases: pratos, custos fixos, canais, vendas).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as insumosApi from '@/lib/insumos'
import type { NovoInsumo } from '@/lib/insumos'

const CHAVE_INSUMOS = ['insumos']

export function useInsumos() {
  return useQuery({ queryKey: CHAVE_INSUMOS, queryFn: insumosApi.listarInsumos })
}

export function useInsumoEmUso(id: string | undefined, habilitado: boolean) {
  return useQuery({
    queryKey: ['insumos', id, 'em-uso'],
    queryFn: () => insumosApi.insumoEmUso(id as string),
    enabled: habilitado && id !== undefined,
  })
}

export function useCriarInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NovoInsumo) => insumosApi.criarInsumo(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_INSUMOS }),
  })
}

export function useAtualizarInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, campos }: { id: string; campos: Partial<NovoInsumo> }) =>
      insumosApi.atualizarInsumo(id, campos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_INSUMOS }),
  })
}

export function useArquivarInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      insumosApi.arquivarInsumo(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_INSUMOS }),
  })
}

export function useExcluirInsumo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => insumosApi.excluirInsumo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_INSUMOS }),
  })
}

export function useRegistrarCompra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      precoPago,
      quantidadeComprada,
    }: {
      id: string
      precoPago: number
      quantidadeComprada: number
    }) => insumosApi.registrarCompra(id, precoPago, quantidadeComprada),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_INSUMOS }),
  })
}
