-- ============================================================================
-- James Delivery Manager — Fase 2: dados de exemplo (seed)
-- Idempotente: pode rodar de novo sem duplicar linhas.
--   - Tabelas sem unique em "nome" usam WHERE NOT EXISTS (checa pelo nome).
--   - Tabelas com unique de verdade usam ON CONFLICT DO NOTHING.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Canais de venda: Venda Direta (0% / 0%) e iFood (25% / 0%)
-- ----------------------------------------------------------------------------
insert into canais (nome, comissao_pct, taxa_pagamento_pct)
select 'Venda Direta', 0, 0
where not exists (select 1 from canais where nome = 'Venda Direta');

insert into canais (nome, comissao_pct, taxa_pagamento_pct)
select 'iFood', 25, 0
where not exists (select 1 from canais where nome = 'iFood');

-- ----------------------------------------------------------------------------
-- Custos fixos mensais
-- ----------------------------------------------------------------------------
insert into custos_fixos (nome, valor_mensal)
select 'Aluguel da moto', 600
where not exists (select 1 from custos_fixos where nome = 'Aluguel da moto');

insert into custos_fixos (nome, valor_mensal)
select 'Gás de cozinha', 120
where not exists (select 1 from custos_fixos where nome = 'Gás de cozinha');

insert into custos_fixos (nome, valor_mensal)
select 'Energia/água', 80
where not exists (select 1 from custos_fixos where nome = 'Energia/água');

insert into custos_fixos (nome, valor_mensal)
select 'Combustível da moto', 150
where not exists (select 1 from custos_fixos where nome = 'Combustível da moto');

insert into custos_fixos (nome, valor_mensal)
select 'DAS do MEI', 75
where not exists (select 1 from custos_fixos where nome = 'DAS do MEI');

-- ----------------------------------------------------------------------------
-- Insumos: Arroz branco, Alcatra, Embalagem térmica
-- ----------------------------------------------------------------------------
insert into insumos (nome, preco_pago, quantidade_comprada, unidade, fator_rendimento)
select 'Arroz branco', 5.00, 1000, 'g', 2.2
where not exists (select 1 from insumos where nome = 'Arroz branco');

insert into insumos (nome, preco_pago, quantidade_comprada, unidade, fator_rendimento)
select 'Alcatra', 35.00, 1000, 'g', 0.7
where not exists (select 1 from insumos where nome = 'Alcatra');

insert into insumos (nome, preco_pago, quantidade_comprada, unidade, fator_rendimento)
select 'Embalagem térmica', 50.00, 100, 'un', 1
where not exists (select 1 from insumos where nome = 'Embalagem térmica');

-- ----------------------------------------------------------------------------
-- Prato: Marmita Padrão
-- 150g arroz pronto + 150g carne pronta + 1 embalagem
-- custo direto esperado ≈ R$ 8,34
--   arroz:     150 ÷ 2.2 × 0,005 ≈ 0,34
--   carne:     150 ÷ 0.7 × 0,035 ≈ 7,50
--   embalagem: 1 × 0,50           = 0,50
-- ----------------------------------------------------------------------------
insert into pratos (nome, categoria, rende_porcoes)
select 'Marmita Padrão', 'marmita', 1
where not exists (select 1 from pratos where nome = 'Marmita Padrão');

-- Itens da ficha técnica: busca prato e insumos por nome via CTE
with prato as (
  select id from pratos where nome = 'Marmita Padrão'
),
insumo_arroz as (
  select id from insumos where nome = 'Arroz branco'
),
insumo_carne as (
  select id from insumos where nome = 'Alcatra'
),
insumo_embalagem as (
  select id from insumos where nome = 'Embalagem térmica'
)
insert into itens_ficha (prato_id, insumo_id, quantidade_pronta)
select prato.id, insumo_arroz.id, 150 from prato, insumo_arroz
union all
select prato.id, insumo_carne.id, 150 from prato, insumo_carne
union all
select prato.id, insumo_embalagem.id, 1 from prato, insumo_embalagem
on conflict (prato_id, insumo_id) do nothing;

-- ----------------------------------------------------------------------------
-- Config: linha única (id = 1) — 10 vendas/dia, 20 dias/mês, margem 30%
-- ----------------------------------------------------------------------------
insert into config (id, vendas_estimadas_dia, dias_trabalhados_mes, margem_alvo_pct)
values (1, 10, 20, 30)
on conflict (id) do nothing;
