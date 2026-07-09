import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import ContadorVenda from '@/components/vendas/ContadorVenda'
import BannerRitmoReal from '@/components/vendas/BannerRitmoReal'
import RankingPratos from '@/components/vendas/RankingPratos'
import ComparativoCanalRealizado, {
  type CanalRealizado,
} from '@/components/vendas/ComparativoCanalRealizado'
import { usePratos } from '@/hooks/usePratos'
import { useInsumos } from '@/hooks/useInsumos'
import { useCanais } from '@/hooks/useCanais'
import { useCustosFixos } from '@/hooks/useCustosFixos'
import { useAtualizarConfig, useConfig } from '@/hooks/useConfig'
import { usePrecosOficiais } from '@/hooks/usePrecosOficiais'
import { useUpsertVenda, useVendasDoDia, useVendasDoPeriodo } from '@/hooks/useVendas'
import {
  agregarPorCanal,
  agregarPorPrato,
  chaveParPratoCanal,
  custoFixoPorMarmita,
  custoPorPorcao,
  diasComVenda,
  divergeDaEstimativa,
  lucroEstimado,
  lucroPorUnidade,
  precoSugerido,
  pratoMaisLucrativo,
  pratoMaisVendido,
  ritmoMensalizado,
  totalMarmitas,
  type MapaPrecoLucro,
  type VendaParaAgregacao,
} from '@/lib/calculos'
import {
  fimDoMes,
  formatarDataLegivel,
  hojeISO,
  inicioDoMes,
  nomeDoMes,
  somarDias,
  somarMeses,
} from '@/lib/datas'

/**
 * Registro diário de vendas (grade prato × canal, +1/−1 com salvamento
 * automático) e visão do mês (totais, real vs estimativa, ranking de
 * pratos, comparativo por canal) — plano-07.
 */
export default function Vendas() {
  const pratosQuery = usePratos()
  const insumosQuery = useInsumos()
  const canaisQuery = useCanais()
  const custosFixosQuery = useCustosFixos()
  const configQuery = useConfig()
  const precosOficiaisQuery = usePrecosOficiais()
  const atualizarConfig = useAtualizarConfig()

  const [diaSelecionado, setDiaSelecionado] = useState(hojeISO())
  const [mesSelecionado, setMesSelecionado] = useState(inicioDoMes(hojeISO()))

  const vendasDiaQuery = useVendasDoDia(diaSelecionado)
  const vendasMesQuery = useVendasDoPeriodo(inicioDoMes(mesSelecionado), fimDoMes(mesSelecionado))
  const upsertVenda = useUpsertVenda()

  // --- estado local otimista da grade do dia (chave `${pratoId}:${canalId}`) ---
  const [quantidades, setQuantidades] = useState<Record<string, number>>({})
  const [pendentes, setPendentes] = useState<Set<string>>(new Set())
  // falhas de gravação: a célula fica marcada até um retry dar certo —
  // nunca mostrar "Salvo" com dado só na tela
  const [errosSalvar, setErrosSalvar] = useState<Map<string, string>>(new Map())
  const diaCarregadoRef = useRef<string | null>(null)
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // espelho síncrono das quantidades: dois toques no mesmo tick leem o
  // valor já incrementado (o estado React sozinho perderia um +1)
  const quantidadesRef = useRef<Record<string, number>>({})
  // fila de gravação POR CÉLULA: garante que upserts saem em ordem
  // (sem fila, um 1→0 delete e um 0→1 upsert podiam se inverter na rede)
  const filaRef = useRef<Record<string, Promise<void>>>({})

  useEffect(() => {
    if (!vendasDiaQuery.data) return
    const mapa: Record<string, number> = {}
    for (const venda of vendasDiaQuery.data) {
      mapa[chaveParPratoCanal(venda.prato_id, venda.canal_id)] = venda.quantidade
    }
    if (diaCarregadoRef.current !== diaSelecionado) {
      // mudou o dia: adota o servidor
      diaCarregadoRef.current = diaSelecionado
      quantidadesRef.current = mapa
      setQuantidades(mapa)
    } else if (
      Object.keys(timersRef.current).length === 0 &&
      pendentes.size === 0 &&
      errosSalvar.size === 0
    ) {
      // mesmo dia e tudo quieto (nada digitando/salvando/com erro):
      // reconcilia com o servidor para nunca ficar preso num estado antigo
      quantidadesRef.current = mapa
      setQuantidades(mapa)
    }
  }, [vendasDiaQuery.data, diaSelecionado, pendentes, errosSalvar])

  function marcarPendente(chave: string) {
    setPendentes((atual) => new Set(atual).add(chave))
  }
  function desmarcarPendente(chave: string) {
    setPendentes((atual) => {
      const proximo = new Set(atual)
      proximo.delete(chave)
      return proximo
    })
  }

  function salvar(chave: string, data: string, quantidade: number) {
    const [pratoId, canalId] = chave.split(':')
    marcarPendente(chave)
    const anterior = filaRef.current[chave] ?? Promise.resolve()
    filaRef.current[chave] = anterior
      .catch(() => {})
      .then(() =>
        upsertVenda.mutateAsync({ data, prato_id: pratoId, canal_id: canalId, quantidade })
      )
      .then(() => {
        desmarcarPendente(chave)
        setErrosSalvar((atual) => {
          if (!atual.has(chave)) return atual
          const proximo = new Map(atual)
          proximo.delete(chave)
          return proximo
        })
      })
      .catch(() => {
        desmarcarPendente(chave)
        setErrosSalvar((atual) => new Map(atual).set(chave, data))
        toast.error('Não deu para salvar essa venda. Verifique a conexão.', {
          action: { label: 'Tentar de novo', onClick: () => salvar(chave, data, quantidade) },
        })
      })
  }

  function tentarSalvarErrosDeNovo() {
    for (const [chave, data] of errosSalvar) {
      salvar(chave, data, quantidadesRef.current[chave] ?? 0)
    }
  }

  // Debounce de 600ms por célula: toques rápidos viram uma única gravação.
  function agendarSalvamento(chave: string, quantidade: number) {
    clearTimeout(timersRef.current[chave])
    const dataDoAgendamento = diaSelecionado
    timersRef.current[chave] = setTimeout(() => {
      delete timersRef.current[chave]
      salvar(chave, dataDoAgendamento, quantidade)
    }, 600)
  }

  // Antes de trocar de dia, dispara na hora qualquer gravação ainda em
  // espera — não pode perder um toque só porque o dono virou a página.
  function flushPendentes() {
    for (const chave of Object.keys(timersRef.current)) {
      clearTimeout(timersRef.current[chave])
      delete timersRef.current[chave]
      salvar(chave, diaSelecionado, quantidadesRef.current[chave] ?? 0)
    }
  }

  function irParaDia(novoDia: string) {
    flushPendentes()
    setDiaSelecionado(novoDia)
  }

  function aplicarQuantidade(chave: string, nova: number) {
    quantidadesRef.current = { ...quantidadesRef.current, [chave]: nova }
    setQuantidades(quantidadesRef.current)
    agendarSalvamento(chave, nova)
  }

  function alterarQuantidade(pratoId: string, canalId: string, delta: number) {
    const chave = chaveParPratoCanal(pratoId, canalId)
    // lê do espelho síncrono: dois toques no mesmo tick não perdem +1
    aplicarQuantidade(chave, Math.max(0, (quantidadesRef.current[chave] ?? 0) + delta))
  }

  function definirQuantidade(pratoId: string, canalId: string, valor: number) {
    const chave = chaveParPratoCanal(pratoId, canalId)
    aplicarQuantidade(chave, Math.max(0, valor))
  }

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
        Não deu para carregar os dados de vendas. Verifique a conexão e recarregue a página.
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

  const pratosAtivos = pratos.filter((prato) => prato.ativo)
  const canaisAtivos = canais.filter((canal) => canal.ativo)
  const pratoPorId = new Map(pratos.map((prato) => [prato.id, prato]))
  const insumosPorId = new Map(insumos.map((insumo) => [insumo.id, insumo]))

  const totalFixos = custosFixos
    .filter((custo) => custo.ativo)
    .reduce((soma, custo) => soma + custo.valor_mensal, 0)
  const custoFixo = custoFixoPorMarmita(
    totalFixos,
    config.vendas_estimadas_dia,
    config.dias_trabalhados_mes
  )

  // Mapa de preço em uso e lucro por unidade de cada par prato×canal, com o
  // custo ATUAL — usado tanto no dia quanto no mês (lucro histórico é
  // aproximado por decisão consciente do CLAUDE.md). Considera TODOS os
  // pratos/canais (não só ativos): uma venda antiga pode citar um prato ou
  // canal já arquivado.
  const mapaPrecoLucro: MapaPrecoLucro = {}
  for (const prato of pratos) {
    const itens = prato.itens_ficha.flatMap((item) => {
      const insumo = insumosPorId.get(item.insumo_id)
      return insumo ? [{ quantidade_pronta: item.quantidade_pronta, insumo }] : []
    })
    const custoTotal = custoPorPorcao(itens, prato.rende_porcoes) + custoFixo
    const margemAlvo = prato.margem_alvo_pct ?? config.margem_alvo_pct
    for (const canal of canais) {
      const oficial =
        precosOficiais.find(
          (registro) => registro.prato_id === prato.id && registro.canal_id === canal.id
        )?.preco ?? null
      const sugerido = precoSugerido(
        custoTotal,
        canal.comissao_pct,
        canal.taxa_pagamento_pct,
        margemAlvo
      )
      const preco = oficial ?? sugerido
      if (preco === null) continue
      const lucroUnidade = lucroPorUnidade(
        preco,
        custoTotal,
        canal.comissao_pct,
        canal.taxa_pagamento_pct
      )
      mapaPrecoLucro[chaveParPratoCanal(prato.id, canal.id)] = { preco, lucroUnidade }
    }
  }

  function nomePrato(pratoId: string): string {
    return pratoPorId.get(pratoId)?.nome ?? 'Prato removido'
  }

  // --- rodapé do dia (a partir do estado local, sempre a verdade na tela).
  // Percorre TODAS as chaves com venda (inclusive de prato/canal arquivado,
  // que não aparecem na grade mas contam no total do dia). ---
  const vendasDoDiaParaTotal: VendaParaAgregacao[] = []
  const chavesNaGrade = new Set(
    pratosAtivos.flatMap((prato) =>
      canaisAtivos.map((canal) => chaveParPratoCanal(prato.id, canal.id))
    )
  )
  let marmitasForaDaGradeHoje = 0
  for (const [chave, quantidade] of Object.entries(quantidades)) {
    if (quantidade <= 0) continue
    const [pratoId, canalId] = chave.split(':')
    vendasDoDiaParaTotal.push({
      data: diaSelecionado,
      prato_id: pratoId,
      canal_id: canalId,
      quantidade,
    })
    if (!chavesNaGrade.has(chave)) marmitasForaDaGradeHoje += quantidade
  }
  const totalHoje = totalMarmitas(vendasDoDiaParaTotal)
  const lucroHoje = lucroEstimado(vendasDoDiaParaTotal, mapaPrecoLucro)

  // --- visão do mês (a partir do servidor) ---
  const vendasMes: VendaParaAgregacao[] = (vendasMesQuery.data ?? []).map((venda) => ({
    data: venda.data,
    prato_id: venda.prato_id,
    canal_id: venda.canal_id,
    quantidade: venda.quantidade,
  }))
  const totalMes = totalMarmitas(vendasMes)
  const lucroMes = lucroEstimado(vendasMes, mapaPrecoLucro)
  const diasComVendaMes = diasComVenda(vendasMes)
  const ritmoReal = ritmoMensalizado(totalMes, diasComVendaMes, config.dias_trabalhados_mes)
  const estimativaMensal = config.vendas_estimadas_dia * config.dias_trabalhados_mes
  const ritmoRealPorDiaAtual = diasComVendaMes > 0 ? totalMes / diasComVendaMes : 0
  // banner só no MÊS CORRENTE — folhear um mês antigo não pode oferecer
  // gravar um ritmo velho por cima da estimativa vigente
  const divergiu =
    diasComVendaMes > 0 &&
    mesSelecionado === inicioDoMes(hojeISO()) &&
    divergeDaEstimativa(ritmoReal, estimativaMensal)

  // vendas cujo par prato×canal não tem preço possível (margem impossível
  // sem preço oficial, ou prato removido de verdade): contam nas marmitas
  // mas NÃO entram em receita/lucro — avisar em vez de subestimar em silêncio
  const marmitasSemPreco = totalMarmitas(
    vendasMes.filter(
      (venda) => !(chaveParPratoCanal(venda.prato_id, venda.canal_id) in mapaPrecoLucro)
    )
  )

  const rankingPratos = agregarPorPrato(vendasMes, mapaPrecoLucro)
  const maisVendido = pratoMaisVendido(rankingPratos)
  const maisLucrativo = pratoMaisLucrativo(rankingPratos)

  const resultadoPorCanal = agregarPorCanal(vendasMes, mapaPrecoLucro)
  const canaisRealizados: CanalRealizado[] = canaisAtivos.map((canal) => {
    const resultado = resultadoPorCanal.find((item) => item.canal_id === canal.id)
    return {
      nome: canal.nome,
      quantidade: resultado?.quantidade ?? 0,
      receita: resultado?.receita ?? 0,
      lucro: resultado?.lucro ?? 0,
    }
  })

  function usarRitmoReal() {
    const novaEstimativa = Math.round((ritmoRealPorDiaAtual || 0) * 10) / 10
    if (novaEstimativa <= 0) return
    atualizarConfig.mutate(
      { vendas_estimadas_dia: novaEstimativa },
      {
        onSuccess: () => toast.success('Estimativa de vendas/dia atualizada para o ritmo real.'),
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      }
    )
  }

  return (
    <section className="pb-10">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Vendas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Lance as vendas do dia e acompanhe o resultado do mês.
        </p>
      </header>

      {/* ---------- Grade do dia ---------- */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Lançamento do dia</h2>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {errosSalvar.size > 0 ? (
            <button
              type="button"
              onClick={tentarSalvarErrosDeNovo}
              className="flex min-h-11 items-center gap-1.5 font-semibold text-destructive"
            >
              <AlertTriangle className="size-3.5" aria-hidden />
              Não salvo — tentar de novo
            </button>
          ) : pendentes.size > 0 ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Salvando...
            </>
          ) : (
            <>
              <Check className="size-3.5 text-lucro" aria-hidden /> Salvo
            </>
          )}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          className="size-11 shrink-0 rounded-full p-0"
          onClick={() => irParaDia(somarDias(diaSelecionado, -1))}
          aria-label="Dia anterior"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold capitalize">
            {formatarDataLegivel(diaSelecionado)}
          </span>
          <input
            type="date"
            value={diaSelecionado}
            max={hojeISO()}
            onChange={(e) => e.target.value && irParaDia(e.target.value)}
            className="h-8 rounded-md border bg-card px-2 text-xs text-muted-foreground"
            aria-label="Escolher outra data"
          />
        </div>
        <Button
          variant="outline"
          className="size-11 shrink-0 rounded-full p-0"
          onClick={() => irParaDia(somarDias(diaSelecionado, 1))}
          disabled={diaSelecionado >= hojeISO()}
          aria-label="Próximo dia"
        >
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>

      {vendasDiaQuery.isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : vendasDiaQuery.isError ? (
        <p className="mt-6 text-center text-sm text-destructive">
          Não deu para carregar as vendas do dia.
        </p>
      ) : (
        <>
          {pratosAtivos.length === 0 && (
            <Card className="mt-4 border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum prato ativo — cadastre em Pratos.
              </CardContent>
            </Card>
          )}
          {pratosAtivos.length > 0 && canaisAtivos.length === 0 && (
            <Card className="mt-4 border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum canal ativo — cadastre em Custos.
              </CardContent>
            </Card>
          )}

          <div className="mt-4 space-y-3">
            {pratosAtivos.map((prato) => (
              <Card key={prato.id}>
                <CardContent className="py-3">
                  <p className="truncate font-semibold">{prato.nome}</p>
                  <div className="mt-2 space-y-2">
                    {canaisAtivos.map((canal) => {
                      const chave = chaveParPratoCanal(prato.id, canal.id)
                      return (
                        <div key={canal.id} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-sm text-muted-foreground">
                            {canal.nome}
                          </span>
                          <ContadorVenda
                            quantidade={quantidades[chave] ?? 0}
                            onAlterar={(delta) => alterarQuantidade(prato.id, canal.id, delta)}
                            onDefinir={(valor) => definirQuantidade(prato.id, canal.id, valor)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pratosAtivos.length > 0 && canaisAtivos.length > 0 && (
            <Card className="mt-3 border-lucro/30 bg-lucro/5">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total do dia</p>
                  <p className="text-lg font-bold tabular-nums">{totalHoje} marmitas</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Lucro estimado</p>
                  <Dinheiro
                    valor={lucroHoje}
                    tamanho="lg"
                    tom={lucroHoje >= 0 ? 'lucro' : 'negativo'}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          {marmitasForaDaGradeHoje > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Inclui {marmitasForaDaGradeHoje}{' '}
              {marmitasForaDaGradeHoje === 1 ? 'marmita' : 'marmitas'} de prato/canal
              arquivado (para editar, reative em Pratos/Custos).
            </p>
          )}
        </>
      )}

      {/* ---------- Visão do mês ---------- */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
        <h2 className="text-lg font-semibold">Visão do mês</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="size-11 p-0 md:size-8"
            onClick={() => setMesSelecionado((atual) => somarMeses(atual, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="min-w-28 text-center text-sm font-medium capitalize">
            {nomeDoMes(mesSelecionado)}
          </span>
          <Button
            variant="ghost"
            className="size-11 p-0 md:size-8"
            onClick={() => setMesSelecionado((atual) => somarMeses(atual, 1))}
            disabled={mesSelecionado >= inicioDoMes(hojeISO())}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {vendasMesQuery.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
      ) : vendasMesQuery.isError ? (
        <p className="mt-4 text-sm text-destructive">Não deu para carregar as vendas do mês.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {/* 1. Totais */}
          <Card>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Marmitas vendidas</p>
                <p className="text-2xl font-bold tabular-nums">{totalMes}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Lucro estimado</p>
                <Dinheiro valor={lucroMes} tamanho="xl" tom={lucroMes >= 0 ? 'lucro' : 'negativo'} />
              </div>
            </CardContent>
          </Card>

          {marmitasSemPreco > 0 && (
            <p className="flex items-start gap-1.5 rounded-md bg-custo/10 px-2.5 py-2 text-xs font-medium text-custo">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                {marmitasSemPreco} {marmitasSemPreco === 1 ? 'marmita' : 'marmitas'} do mês
                estão FORA da receita e do lucro acima: o prato+canal não tem preço
                possível (margem impossível sem preço oficial, ou prato excluído).
                Resolva em Preços.
              </span>
            </p>
          )}

          {/* 2. Real vs estimativa */}
          {divergiu && (
            <BannerRitmoReal
              ritmoRealDia={ritmoRealPorDiaAtual}
              onUsarRitmoReal={usarRitmoReal}
              salvando={atualizarConfig.isPending}
            />
          )}

          {/* 3. Ranking de pratos */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Ranking de pratos</h3>
            <div className="mt-2">
              <RankingPratos
                maisVendido={maisVendido}
                maisLucrativo={maisLucrativo}
                nomePrato={nomePrato}
              />
            </div>
          </div>

          {/* 4. Comparativo por canal */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Comparativo por canal</h3>
            <div className="mt-2">
              {canaisAtivos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum canal ativo — cadastre em Custos.
                </p>
              ) : (
                <ComparativoCanalRealizado canais={canaisRealizados} />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
