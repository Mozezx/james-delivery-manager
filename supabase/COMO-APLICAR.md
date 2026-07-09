# Como aplicar as migrations no Supabase

Passo a passo simples, sem precisar instalar nada.

## 1. Abrir o SQL Editor

1. Entre no painel do Supabase (https://supabase.com/dashboard) e abra o projeto do James Delivery Manager.
2. No menu lateral esquerdo, clique em **SQL Editor**.
3. Clique em **New query** (novo script).

## 2. Rodar o schema (001)

1. Abra o arquivo `supabase/migrations/001_schema.sql` neste repositório.
2. Copie **todo o conteúdo** do arquivo.
3. Cole no SQL Editor do Supabase.
4. Clique em **Run** (ou aperte Ctrl+Enter).
5. Deve aparecer "Success. No rows returned". Se der algum erro, leia a mensagem — provavelmente o script já foi rodado antes (as tabelas já existem).

## 3. Rodar o seed (002)

1. Abra uma **nova query** no SQL Editor (New query de novo).
2. Abra o arquivo `supabase/migrations/002_seed.sql`, copie tudo e cole no editor.
3. Clique em **Run**.
4. Pode rodar esse script quantas vezes quiser: ele não duplica dados (é idempotente).

## 4. Conferir se deu certo

1. No menu lateral, clique em **Table Editor**.
2. Você deve ver as tabelas: `insumos`, `pratos`, `canais`, `precos_oficiais`, `itens_ficha`, `custos_fixos`, `config`, `vendas`.
3. Abra a tabela `insumos` — deve ter 3 linhas: Arroz branco, Alcatra, Embalagem térmica.
4. Abra a tabela `pratos` — deve ter 1 linha: Marmita Padrão.
5. Abra a tabela `canais` — deve ter 2 linhas: Venda Direta e iFood.
6. Abra a tabela `custos_fixos` — deve ter 5 linhas (moto, gás, energia/água, combustível, DAS MEI).
7. Abra a tabela `config` — deve ter 1 linha só, com id = 1.

## 5. Conferir o Storage (fotos dos pratos)

1. No menu lateral, clique em **Storage**.
2. Deve existir um bucket chamado `fotos-pratos`, marcado como privado (não público).

## Se algo der errado

- Erro do tipo "already exists" (já existe): normal se você rodou o script mais de uma vez. Pode ignorar.
- Se quiser recomeçar do zero, apague as tabelas manualmente pelo Table Editor (ou peça ajuda) antes de rodar o 001 de novo — os scripts não apagam nada sozinhos.
