-- ============================================================================
-- James Delivery Manager — Fase 2: schema completo do banco
-- Ordem das tabelas respeita dependências de foreign key:
--   insumos, pratos, canais, precos_oficiais, itens_ficha, custos_fixos,
--   config, vendas
-- ============================================================================

-- Tipo de unidade de compra/uso dos insumos (g, ml ou unidade)
create type unidade as enum ('g', 'ml', 'un');

-- ----------------------------------------------------------------------------
-- Insumos (base de custo)
-- ----------------------------------------------------------------------------
create table insumos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco_pago numeric(10,2) not null,          -- quanto pagou na compra
  quantidade_comprada numeric(10,2) not null, -- em unidade base (g/ml/un)
  unidade unidade not null,
  fator_rendimento numeric(5,3) not null default 1, -- cozido/cru (arroz ~2.2, carne ~0.7)
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
-- custo por unidade base CRUA = preco_pago / quantidade_comprada (calculado no app)

-- ----------------------------------------------------------------------------
-- Pratos (ficha técnica)
-- ----------------------------------------------------------------------------
create table pratos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,                          -- livre: "marmita", "bebida"...
  foto_url text,                           -- Supabase Storage (bucket fotos-pratos)
  rende_porcoes int not null default 1 check (rende_porcoes > 0),
  -- rende_porcoes = 1 → ficha por porção; > 1 → ficha "de panela" (lote);
  -- quantidades em itens_ficha são sempre do LOTE inteiro; custo/porção = total ÷ rende_porcoes
  margem_alvo_pct numeric(5,2),            -- null = usa a margem global de config
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Canais de venda (precisa existir antes de precos_oficiais, que a referencia)
-- ----------------------------------------------------------------------------
create table canais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  comissao_pct numeric(5,2) not null default 0,       -- % sobre o preço
  taxa_pagamento_pct numeric(5,2) not null default 0, -- % sobre o preço
  ativo boolean not null default true
);

-- ----------------------------------------------------------------------------
-- Preço oficial escolhido pelo dono, por prato e canal
-- (ausente = ainda usa o sugerido pelo simulador)
-- ----------------------------------------------------------------------------
create table precos_oficiais (
  id uuid primary key default gen_random_uuid(),
  prato_id uuid not null references pratos(id) on delete cascade,
  canal_id uuid not null references canais(id),
  preco numeric(10,2) not null,
  unique (prato_id, canal_id)
);

-- ----------------------------------------------------------------------------
-- Itens da ficha técnica (insumo + quantidade pronta usada no prato/lote)
-- insumo_id SEM cascade: arquiva-se insumo, não se apaga
-- ----------------------------------------------------------------------------
create table itens_ficha (
  id uuid primary key default gen_random_uuid(),
  prato_id uuid not null references pratos(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  quantidade_pronta numeric(10,2) not null, -- peso PRONTO no prato
  unique (prato_id, insumo_id)
);

-- ----------------------------------------------------------------------------
-- Custos fixos mensais
-- ----------------------------------------------------------------------------
create table custos_fixos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor_mensal numeric(10,2) not null,
  ativo boolean not null default true
);

-- ----------------------------------------------------------------------------
-- Configurações (linha única, id sempre 1)
-- ----------------------------------------------------------------------------
create table config (
  id int primary key default 1 check (id = 1),
  vendas_estimadas_dia numeric(6,1) not null default 10,
  dias_trabalhados_mes int not null default 20,
  margem_alvo_pct numeric(5,2) not null default 30
);

-- ----------------------------------------------------------------------------
-- Vendas diárias (por prato e canal) — upsert por dia/prato/canal
-- ----------------------------------------------------------------------------
create table vendas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  prato_id uuid not null references pratos(id),
  canal_id uuid not null references canais(id),
  quantidade int not null check (quantidade > 0),
  unique (data, prato_id, canal_id)
);

-- ============================================================================
-- RLS — Row Level Security
-- App de conta única: qualquer usuário autenticado pode ler/escrever tudo.
-- Sem coluna user_id no MVP (se um dia houver multiusuário, migra o schema).
-- ============================================================================

alter table insumos enable row level security;
alter table pratos enable row level security;
alter table canais enable row level security;
alter table precos_oficiais enable row level security;
alter table itens_ficha enable row level security;
alter table custos_fixos enable row level security;
alter table config enable row level security;
alter table vendas enable row level security;

create policy "autenticado_total" on insumos
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "autenticado_total" on pratos
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "autenticado_total" on canais
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "autenticado_total" on precos_oficiais
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "autenticado_total" on itens_ficha
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "autenticado_total" on custos_fixos
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "autenticado_total" on config
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "autenticado_total" on vendas
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ============================================================================
-- Storage — bucket privado para fotos dos pratos
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('fotos-pratos', 'fotos-pratos', false)
on conflict do nothing;

-- Políticas de storage.objects restritas ao bucket fotos-pratos, só autenticado
create policy "fotos_pratos_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-pratos');

create policy "fotos_pratos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-pratos');

create policy "fotos_pratos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos-pratos')
  with check (bucket_id = 'fotos-pratos');

create policy "fotos_pratos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-pratos');
