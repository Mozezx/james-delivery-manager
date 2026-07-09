// Estado/cache dos custos fixos via TanStack Query. Camada de dados pura
// fica em src/lib/custosFixos.ts — este arquivo só liga ela ao React.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as custosFixosApi from '@/lib/custosFixos'
import type { NovoCustoFixo } from '@/lib/custosFixos'

const CHAVE_CUSTOS_FIXOS = ['custos-fixos']

export function useCustosFixos() {
  return useQuery({ queryKey: CHAVE_CUSTOS_FIXOS, queryFn: custosFixosApi.listarCustosFixos })
}

export function useCriarCustoFixo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: NovoCustoFixo) => custosFixosApi.criarCustoFixo(dados),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CUSTOS_FIXOS }),
  })
}

export function useAtualizarCustoFixo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, campos }: { id: string; campos: Partial<NovoCustoFixo> }) =>
      custosFixosApi.atualizarCustoFixo(id, campos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CUSTOS_FIXOS }),
  })
}

export function useArquivarCustoFixo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      custosFixosApi.arquivarCustoFixo(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CUSTOS_FIXOS }),
  })
}

export function useExcluirCustoFixo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => custosFixosApi.excluirCustoFixo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CUSTOS_FIXOS }),
  })
}
