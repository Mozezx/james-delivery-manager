import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, BadgeCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import Percentual from '@/components/Percentual'
import CampoQuantidade from '@/components/CampoQuantidade'
import { useConfig } from '@/hooks/useConfig'
import { useCustosFixos } from '@/hooks/useCustosFixos'
import { useCanais } from '@/hooks/useCanais'
import {
  usePrecosOficiais,
  useDefinirPrecoOficial,
  useRemoverPrecoOficial,
} from '@/hooks/usePrecosOficiais'
import { useAtualizarPrato } from '@/hooks/usePratos'
import {
  arredondarPsicologico,
  comissaoEmReais,
  custoFixoPorMarmita,
  lucroPorUnidade,
  margemEfetiva,
  precoSugerido,
} from '@/lib/calculos'
import { formatarDinheiro, lerDecimal } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Canal, Prato } from '@/lib/tipos'

/**
 * Bloco de precificação do detalhe do prato (plano-06): resumo do custo,
 * simulador de margem e comparação por canal com preço oficial.
 * Todo o cálculo é local (sem ida ao banco ao arrastar o slider).
 */
export default function PrecificacaoPrato({
  prato,
  custoPorcaoDireto,
}: {
  prato: Prato
  custoPorcaoDireto: number
}) {
  const { data: config } = useConfig()
  const { data: custosFixos } = useCustosFixos()
  const { data: canais } = useCanais()
  const { data: precosOficiais } = usePrecosOficiais()
  const atualizarPrato = useAtualizarPrato()
  const definirOficial = useDefinirPrecoOficial()
  const removerOficial = useRemoverPrecoOficial()

  // margem do simulador como texto (aceita vírgula); inicia na margem
  // efetiva do prato (exceção do prato ?? global da config)
  const [margemTexto, setMargemTexto] = useState<string | null>(null)

  const margemDoPrato = prato.margem_alvo_pct
  const margemGlobal = config?.margem_alvo_pct ?? 30
  const margemAlvo = margemDoPrato ?? margemGlobal

  useEffect(() => {
    // sincroniza o simulador quando o prato/config carregam ou mudam
    setMargemTexto(null)
  }, [prato.id, margemDoPrato, margemGlobal])

  const margemSimulada =
    margemTexto === null ? margemAlvo : (lerDecimal(margemTexto) ?? margemAlvo)

  // Gate de carregamento: sem config/custos fixos o custo total sairia
  // subestimado e o dono poderia fixar um preço oficial errado.
  const carregando = !config || !custosFixos || !canais || !precosOficiais
  if (carregando) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Por quanto vender</h2>
        <p className="mt-3 text-sm text-muted-foreground">Carregando precificação...</p>
      </div>
    )
  }

  const totalFixos = custosFixos
    .filter((custo) => custo.ativo)
    .reduce((soma, custo) => soma + custo.valor_mensal, 0)
  const custoFixo = custoFixoPorMarmita(
    totalFixos,
    config.vendas_estimadas_dia,
    config.dias_trabalhados_mes
  )
  const custoTotal = custoPorcaoDireto + custoFixo

  const canaisAtivos = canais.filter((canal) => canal.ativo)

  function salvarMargemDoPrato() {
    const valor = lerDecimal(margemTexto ?? '')
    if (valor === null || valor < 1 || valor > 99) {
      toast.error('Margem deve ficar entre 1 e 99.')
      return
    }
    atualizarPrato.mutate(
      { id: prato.id, campos: { margem_alvo_pct: valor } },
      {
        onSuccess: () => toast.success('Margem deste prato salva.'),
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      }
    )
  }

  function usarMargemGlobal() {
    atualizarPrato.mutate(
      { id: prato.id, campos: { margem_alvo_pct: null } },
      {
        onSuccess: () => toast.success('Prato voltou a usar a margem global.'),
        onError: () => toast.error('Não deu. Tenta de novo.'),
      }
    )
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold">Por quanto vender</h2>

      {/* Resumo do custo — a conta sempre visível */}
      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3 text-sm">
          <span className="text-muted-foreground">direto</span>
          <Dinheiro valor={custoPorcaoDireto} tamanho="sm" tom="custo" />
          <span className="text-muted-foreground">+ fixo</span>
          <Dinheiro valor={custoFixo} tamanho="sm" tom="custo" />
          <span className="text-muted-foreground">=</span>
          <span className="ml-auto">
            <span className="mr-1.5 text-muted-foreground">custo total</span>
            <Dinheiro valor={custoTotal} tamanho="md" tom="custo" />
          </span>
        </CardContent>
      </Card>

      {/* Simulador de margem */}
      <Card className="mt-3">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="simulador-margem" className="text-sm font-medium">
              Margem alvo
            </label>
            <div className="flex items-center gap-2">
              <CampoQuantidade
                id="simulador-margem-campo"
                valor={margemTexto ?? String(margemSimulada).replace('.', ',')}
                onChange={setMargemTexto}
                unidade="%"
                className="w-24"
              />
              {margemDoPrato === null ? (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                  usa a global ({String(margemGlobal).replace('.', ',')}%)
                </span>
              ) : (
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                  margem própria
                </span>
              )}
            </div>
          </div>
          <input
            id="simulador-margem"
            type="range"
            min={5}
            max={60}
            step={1}
            value={Math.min(60, Math.max(5, Math.round(margemSimulada)))}
            onChange={(e) => setMargemTexto(e.target.value)}
            className="slider-margem mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
          />
          {margemTexto !== null && margemSimulada !== margemAlvo && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-11 md:h-8"
                onClick={salvarMargemDoPrato}
                disabled={atualizarPrato.isPending}
              >
                Salvar como margem deste prato
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-11 md:h-8"
                onClick={() => setMargemTexto(null)}
              >
                Descartar simulação
              </Button>
            </div>
          )}
          {margemDoPrato !== null && (
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 h-11 md:h-8"
              onClick={usarMargemGlobal}
            >
              Voltar a usar a margem global
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Comparação por canal */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {canaisAtivos.map((canal) => (
          <CardCanalPreco
            key={canal.id}
            canal={canal}
            custoTotal={custoTotal}
            margemPct={margemSimulada}
            margemAlvoPct={margemAlvo}
            precoOficial={
              precosOficiais.find(
                (registro) => registro.prato_id === prato.id && registro.canal_id === canal.id
              )?.preco ?? null
            }
            aoDefinirOficial={(preco) =>
              definirOficial.mutate(
                { pratoId: prato.id, canalId: canal.id, preco },
                {
                  onSuccess: () =>
                    toast.success(`Preço oficial ${formatarDinheiro(preco)} definido.`),
                  onError: () => toast.error('Não deu para salvar o preço.'),
                }
              )
            }
            aoRemoverOficial={() =>
              removerOficial.mutate(
                { pratoId: prato.id, canalId: canal.id },
                {
                  onSuccess: () => toast.success('Voltou a usar o preço sugerido.'),
                  onError: () => toast.error('Não deu. Tenta de novo.'),
                }
              )
            }
          />
        ))}
      </div>
      {canaisAtivos.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum canal ativo — cadastre em Custos.
        </p>
      )}
    </div>
  )
}

function CardCanalPreco({
  canal,
  custoTotal,
  margemPct,
  margemAlvoPct,
  precoOficial,
  aoDefinirOficial,
  aoRemoverOficial,
}: {
  canal: Canal
  custoTotal: number
  margemPct: number
  margemAlvoPct: number
  precoOficial: number | null
  aoDefinirOficial: (preco: number) => void
  aoRemoverOficial: () => void
}) {
  const sugerido = precoSugerido(
    custoTotal,
    canal.comissao_pct,
    canal.taxa_pagamento_pct,
    margemPct
  )

  if (sugerido === null) {
    const margemOficial =
      precoOficial !== null
        ? margemEfetiva(precoOficial, custoTotal, canal.comissao_pct, canal.taxa_pagamento_pct)
        : null
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-4">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {canal.nome}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            Margem impossível neste canal: comissão ({canal.comissao_pct}%) + taxa (
            {canal.taxa_pagamento_pct}%) + margem ({margemPct}%) chegam a 100% do preço.
          </p>
          {precoOficial !== null && margemOficial !== null && (
            <div className="mt-3 border-t pt-3 text-sm">
              <p className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Preço oficial em uso</span>
                <span className="flex items-baseline gap-2">
                  <Dinheiro valor={precoOficial} tamanho="sm" />
                  <Percentual
                    fracao={margemOficial}
                    tom={margemOficial >= 0 ? 'lucro' : 'negativo'}
                    className="text-xs"
                  />
                </span>
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-11 text-muted-foreground md:h-8"
                onClick={aoRemoverOficial}
              >
                <X className="size-3.5" aria-hidden /> Tirar oficial
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const arredondado = arredondarPsicologico(sugerido)
  const margemDoArredondado = margemEfetiva(
    arredondado,
    custoTotal,
    canal.comissao_pct,
    canal.taxa_pagamento_pct
  )

  const precoEmUso = precoOficial ?? sugerido
  const margemDoOficial =
    precoOficial !== null
      ? margemEfetiva(precoOficial, custoTotal, canal.comissao_pct, canal.taxa_pagamento_pct)
      : null
  const margemCorroida =
    margemDoOficial !== null && margemDoOficial < margemAlvoPct / 100 - 0.001

  const lucroEmUso = lucroPorUnidade(
    precoEmUso,
    custoTotal,
    canal.comissao_pct,
    canal.taxa_pagamento_pct
  )
  const margemEmUso = margemEfetiva(
    precoEmUso,
    custoTotal,
    canal.comissao_pct,
    canal.taxa_pagamento_pct
  )

  return (
    <Card className={cn('relative overflow-hidden', precoOficial !== null && 'border-primary/50')}>
      {precoOficial !== null && (
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden />
      )}
      <CardContent className="py-4">
        <p className="truncate text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {canal.nome}
        </p>

        <p className="mt-1 leading-none">
          <Dinheiro valor={precoEmUso} tamanho="xl" />
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {precoOficial !== null
            ? `preço oficial · sugerido ${formatarDinheiro(sugerido)}`
            : 'preço sugerido'}
        </p>

        {margemCorroida && margemDoOficial !== null && (
          <p className="mt-2 flex items-start gap-1.5 rounded-md bg-custo/10 px-2.5 py-2 text-xs font-medium text-custo">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              O custo subiu: este preço rende{' '}
              <Percentual
                fracao={margemDoOficial}
                tom={margemDoOficial < 0 ? 'negativo' : 'custo'}
              />{' '}
              — abaixo da meta de {String(margemAlvoPct).replace('.', ',')}%.
            </span>
          </p>
        )}

        <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Comissões do canal</dt>
            <dd>
              {canal.comissao_pct + canal.taxa_pagamento_pct > 0 ? (
                <Dinheiro
                  valor={-comissaoEmReais(precoEmUso, canal.comissao_pct, canal.taxa_pagamento_pct)}
                  tamanho="sm"
                  tom="custo"
                />
              ) : (
                <span className="font-medium text-muted-foreground">—</span>
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Lucro por marmita</dt>
            <dd>
              <Dinheiro
                valor={lucroEmUso}
                tamanho="md"
                tom={lucroEmUso >= 0 ? 'lucro' : 'negativo'}
              />
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Margem real</dt>
            <dd>
              <Percentual fracao={margemEmUso} tom={margemEmUso >= 0 ? 'lucro' : 'negativo'} />
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {precoOficial !== arredondado && (
            <Button
              size="sm"
              variant="outline"
              className="h-11 md:h-8"
              onClick={() => aoDefinirOficial(arredondado)}
            >
              <BadgeCheck className="size-3.5" aria-hidden />
              Oficial {formatarDinheiro(arredondado)}
              <span className="text-muted-foreground">
                (<Percentual fracao={margemDoArredondado} className="font-medium" />)
              </span>
            </Button>
          )}
          {precoOficial === null && Math.abs(arredondado - sugerido) > 0.005 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-11 md:h-8"
              onClick={() => aoDefinirOficial(Math.round(sugerido * 100) / 100)}
            >
              Oficial {formatarDinheiro(sugerido)}
            </Button>
          )}
          {precoOficial !== null && (
            <Button
              size="sm"
              variant="ghost"
              className="h-11 text-muted-foreground md:h-8"
              onClick={aoRemoverOficial}
            >
              <X className="size-3.5" aria-hidden /> Tirar oficial
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
