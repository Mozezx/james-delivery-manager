// Tipos espelhando o schema do banco (supabase/migrations/001_schema.sql).
// Convencionais e simples: sem generics espertos.

export type Unidade = 'g' | 'ml' | 'un'

export type Insumo = {
  id: string
  nome: string
  preco_pago: number
  quantidade_comprada: number
  unidade: Unidade
  fator_rendimento: number
  ativo: boolean
  criado_em: string
}

export type Prato = {
  id: string
  nome: string
  categoria: string | null
  foto_url: string | null
  rende_porcoes: number
  margem_alvo_pct: number | null
  ativo: boolean
  criado_em: string
}

export type ItemFicha = {
  id: string
  prato_id: string
  insumo_id: string
  quantidade_pronta: number
}

export type CustoFixo = {
  id: string
  nome: string
  valor_mensal: number
  ativo: boolean
}

export type Canal = {
  id: string
  nome: string
  comissao_pct: number
  taxa_pagamento_pct: number
  ativo: boolean
}

export type PrecoOficial = {
  id: string
  prato_id: string
  canal_id: string
  preco: number
}

export type Config = {
  id: 1
  vendas_estimadas_dia: number
  dias_trabalhados_mes: number
  margem_alvo_pct: number
}

export type Venda = {
  id: string
  data: string
  prato_id: string
  canal_id: string
  quantidade: number
}
