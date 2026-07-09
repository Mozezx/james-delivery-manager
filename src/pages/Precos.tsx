import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import Percentual from '@/components/Percentual'
import { usePratos } from '@/hooks/usePratos'
import { useInsumos } from '@/hooks/useInsumos'
import { useCanais } from '@/hooks/useCanais'
import { useCustosFixos } from '@/hooks/useCustosFixos'
import { useConfig } from '@/hooks/useConfig'
import { usePrecosOficiais } from '@/hooks/usePrecosOficiais'
import {
  custoFixoPorMarmita,
  custoPorPorcao,
  margemEfetiva,
  precoSugerido,
} from '@/lib/calculos'
import { formatarDinheiro } from '@/lib/formato'

/**
 * Visão geral da precificação: cada prato ativo × cada canal ativo, com o
 * preço em uso (oficial ou sugerido) e a margem real colorida.
 * O ajuste fino (simulador, definir oficial) mora na tela do prato.
 */
export default function Precos() {
  const pratosQuery = usePratos()
  const insumosQuery = useInsumos()
  const canaisQuery = useCanais()
  const custosFixosQuery = useCustosFixos()
  const configQuery = useConfig()
  const precosOficiaisQuery = usePrecosOficiais()

  const consultas = [
    pratosQuery,
    insumosQuery,
    canaisQuery,
    custosFixosQuery,
    configQuery,
    precosOficiaisQuery,
  ]
  if (consultas.some((consulta) => consulta.isError)) {
    return (
      <p className="mt-8 text-center text-sm text-destructive">
        Não deu para carregar os preços. Verifique a conexão e recarregue a página.
      </p>
    )
  }

  const pratos = pratosQuery.data
  const insumos = insumosQuery.data
  const canais = canaisQuery.data
  const custosFixos = custosFixosQuery.data
  const config = configQuery.data
  const precosOficiais = precosOficiaisQuery.data

  if (!pratos || !insumos || !canais || !custosFixos || !config || !precosOficiais) {
    return <p className="mt-8 text-center text-sm text-muted-foreground">Carregando...</p>
  }

  const insumosPorId = new Map(insumos.map((insumo) => [insumo.id, insumo]))
  const totalFixos = custosFixos
    .filter((custo) => custo.ativo)
    .reduce((soma, custo) => soma + custo.valor_mensal, 0)
  const custoFixo = custoFixoPorMarmita(
    totalFixos,
    config.vendas_estimadas_dia,
    config.dias_trabalhados_mes
  )
  const canaisAtivos = canais.filter((canal) => canal.ativo)
  const pratosAtivos = (pratos ?? []).filter((prato) => prato.ativo)

  return (
    <section>
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Preços</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Preço em uso e margem real por canal. Toque no prato para simular e
          fixar o preço oficial.
        </p>
      </header>

      {pratosAtivos.length === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum prato ativo — crie um em Pratos.
          </CardContent>
        </Card>
      )}

      <div className="mt-4 space-y-3">
        {pratosAtivos.map((prato) => {
          const itens = prato.itens_ficha.flatMap((item) => {
            const insumo = insumosPorId.get(item.insumo_id)
            return insumo ? [{ quantidade_pronta: item.quantidade_pronta, insumo }] : []
          })
          const custoTotal = custoPorPorcao(itens, prato.rende_porcoes) + custoFixo
          const margemAlvo = prato.margem_alvo_pct ?? config.margem_alvo_pct

          return (
            <Link key={prato.id} to={`/pratos/${prato.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold">{prato.nome}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      custo {formatarDinheiro(custoTotal)} · meta{' '}
                      {String(margemAlvo).replace('.', ',')}%
                    </p>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {canaisAtivos.map((canal) => {
                      const sugerido = precoSugerido(
                        custoTotal,
                        canal.comissao_pct,
                        canal.taxa_pagamento_pct,
                        margemAlvo
                      )
                      const oficial =
                        precosOficiais.find(
                          (registro) =>
                            registro.prato_id === prato.id && registro.canal_id === canal.id
                        )?.preco ?? null
                      const precoEmUso = oficial ?? sugerido

                      if (precoEmUso === null) {
                        return (
                          <p
                            key={canal.id}
                            className="flex items-center gap-1.5 text-xs font-medium text-destructive"
                          >
                            <AlertTriangle className="size-3.5" aria-hidden />
                            {canal.nome}: margem impossível
                          </p>
                        )
                      }

                      const margem = margemEfetiva(
                        precoEmUso,
                        custoTotal,
                        canal.comissao_pct,
                        canal.taxa_pagamento_pct
                      )
                      const tom =
                        margem < 0
                          ? ('negativo' as const)
                          : margem < margemAlvo / 100 - 0.001
                            ? ('custo' as const)
                            : ('lucro' as const)

                      return (
                        <p key={canal.id} className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate text-muted-foreground">
                            {canal.nome}
                            {oficial !== null && ' · oficial'}
                          </span>
                          <span className="flex shrink-0 items-baseline gap-2">
                            <Dinheiro valor={precoEmUso} tamanho="sm" />
                            <Percentual fracao={margem} tom={tom} className="text-xs" />
                          </span>
                        </p>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
