import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import CampoQuantidade from '@/components/CampoQuantidade'
import Dinheiro from '@/components/Dinheiro'
import CardCustoFixo from '@/components/custos/CardCustoFixo'
import FormularioCustoFixoDialog from '@/components/custos/FormularioCustoFixoDialog'
import CardCanal from '@/components/custos/CardCanal'
import FormularioCanalDialog from '@/components/custos/FormularioCanalDialog'
import { useCustosFixos } from '@/hooks/useCustosFixos'
import { useCanais } from '@/hooks/useCanais'
import { useAtualizarConfig, useConfig } from '@/hooks/useConfig'
import { custoFixoPorMarmita } from '@/lib/calculos'
import { formatarDinheiro, lerDecimal } from '@/lib/formato'
import type { CustoFixo, Canal } from '@/lib/tipos'

export default function Custos() {
  const { data: custosFixos, isLoading: carregandoCustos, isError: erroCustos } = useCustosFixos()
  const { data: canais, isLoading: carregandoCanais, isError: erroCanais } = useCanais()
  const { data: config, isLoading: carregandoConfig, isError: erroConfig } = useConfig()
  const atualizarConfig = useAtualizarConfig()

  const [mostrarCustosArquivados, setMostrarCustosArquivados] = useState(false)
  const [custoEditando, setCustoEditando] = useState<CustoFixo | null>(null)
  const [formularioCustoAberto, setFormularioCustoAberto] = useState(false)

  const [canalEditando, setCanalEditando] = useState<Canal | null>(null)
  const [formularioCanalAberto, setFormularioCanalAberto] = useState(false)

  // Estimativas: texto local para digitar livre; persiste no blur.
  const [vendasDiaTexto, setVendasDiaTexto] = useState('')
  const [diasMesTexto, setDiasMesTexto] = useState('')

  useEffect(() => {
    if (!config) return
    setVendasDiaTexto(String(config.vendas_estimadas_dia).replace('.', ','))
    setDiasMesTexto(String(config.dias_trabalhados_mes))
  }, [config])

  const custosFiltrados = useMemo(() => {
    if (!custosFixos) return []
    return custosFixos.filter((c) => (mostrarCustosArquivados ? true : c.ativo))
  }, [custosFixos, mostrarCustosArquivados])

  const canaisAtivos = useMemo(() => canais?.filter((c) => c.ativo) ?? [], [canais])
  const canaisArquivados = useMemo(() => canais?.filter((c) => !c.ativo) ?? [], [canais])

  const totalMensal = useMemo(
    () => (custosFixos ?? []).filter((c) => c.ativo).reduce((soma, c) => soma + c.valor_mensal, 0),
    [custosFixos]
  )

  // Enquanto o campo tem um valor inválido/vazio, o resultado usa o último
  // valor salvo (config) — assim o número nunca "quebra" durante a digitação.
  const vendasDiaLida = lerDecimal(vendasDiaTexto)
  const diasMesLida = lerDecimal(diasMesTexto)
  const vendasDia =
    vendasDiaLida !== null && vendasDiaLida > 0 ? vendasDiaLida : (config?.vendas_estimadas_dia ?? 0)
  const diasMes =
    diasMesLida !== null && diasMesLida > 0 ? diasMesLida : (config?.dias_trabalhados_mes ?? 0)
  const marmitasMes = vendasDia * diasMes
  const custoPorMarmita = custoFixoPorMarmita(totalMensal, vendasDia, diasMes)

  function salvarVendasDia() {
    if (!config) return
    const lido = lerDecimal(vendasDiaTexto)
    if (lido === null || lido <= 0) {
      toast.error('Vendas estimadas por dia inválidas.')
      setVendasDiaTexto(String(config.vendas_estimadas_dia).replace('.', ','))
      return
    }
    if (lido === config.vendas_estimadas_dia) return
    atualizarConfig.mutate(
      { vendas_estimadas_dia: lido },
      { onError: () => toast.error('Não deu para salvar. Tenta de novo.') }
    )
  }

  function salvarDiasMes() {
    if (!config) return
    const lido = lerDecimal(diasMesTexto)
    if (lido === null || lido <= 0) {
      toast.error('Dias trabalhados por mês inválidos.')
      setDiasMesTexto(String(config.dias_trabalhados_mes))
      return
    }
    if (lido === config.dias_trabalhados_mes) return
    atualizarConfig.mutate(
      { dias_trabalhados_mes: Math.round(lido) },
      { onError: () => toast.error('Não deu para salvar. Tenta de novo.') }
    )
  }

  function abrirNovoCusto() {
    setCustoEditando(null)
    setFormularioCustoAberto(true)
  }

  function abrirNovoCanal() {
    setCanalEditando(null)
    setFormularioCanalAberto(true)
  }

  return (
    <section className="space-y-6 pb-20">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Custos fixos</h1>
        <p className="text-sm text-muted-foreground">
          Rateio mensal e canais de venda — a base do preço de cada prato.
        </p>
      </header>

      {/* Resultado do rateio, em destaque */}
      <Card className="border-custo/30 bg-custo/5">
        <CardContent className="space-y-4 pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Custo fixo por marmita</p>
            {erroConfig ? (
              <p className="text-sm text-destructive">
                Não deu para carregar as estimativas. Verifique a conexão e recarregue.
              </p>
            ) : carregandoConfig ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                <Dinheiro valor={custoPorMarmita} tamanho="xl" tom="custo" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatarDinheiro(totalMensal)} ÷ {marmitasMes.toLocaleString('pt-BR')}{' '}
                  marmitas/mês
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendas-dia">Vendas estimadas/dia</Label>
              <CampoQuantidade
                id="vendas-dia"
                valor={vendasDiaTexto}
                onChange={setVendasDiaTexto}
                onBlur={salvarVendasDia}
                unidade="/dia"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dias-mes">Dias trabalhados/mês</Label>
              <CampoQuantidade
                id="dias-mes"
                valor={diasMesTexto}
                onChange={setDiasMesTexto}
                onBlur={salvarDiasMes}
                unidade="dias"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de custos fixos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Lista de custos fixos</h2>
          <Button onClick={abrirNovoCusto} size="sm" className="hidden gap-2 sm:inline-flex">
            <Plus className="size-4" aria-hidden />
            Novo custo
          </Button>
        </div>

        {carregandoCustos && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {erroCustos && (
          <p className="text-sm text-destructive">
            Não deu para carregar os custos fixos. Verifique a conexão e recarregue a página.
          </p>
        )}
        {!carregandoCustos && !erroCustos && custosFiltrados.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum custo fixo cadastrado ainda.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {custosFiltrados.map((custo) => (
            <CardCustoFixo
              key={custo.id}
              custoFixo={custo}
              onEditar={() => {
                setCustoEditando(custo)
                setFormularioCustoAberto(true)
              }}
            />
          ))}
        </div>

        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMostrarCustosArquivados((v) => !v)}
          >
            {mostrarCustosArquivados ? 'Ocultar arquivados' : 'Mostrar arquivados'}
          </Button>
        </div>
      </div>

      {/* Canais de venda */}
      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Canais de venda</h2>
            <p className="text-sm text-muted-foreground">
              Comissão e taxa de pagamento incidem sobre o preço.
            </p>
          </div>
          <Button onClick={abrirNovoCanal} size="sm" variant="outline" className="hidden gap-2 sm:inline-flex">
            <Plus className="size-4" aria-hidden />
            Novo canal
          </Button>
        </div>

        {carregandoCanais && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {erroCanais && (
          <p className="text-sm text-destructive">
            Não deu para carregar os canais. Verifique a conexão e recarregue a página.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canaisAtivos.map((canal) => (
            <CardCanal
              key={canal.id}
              canal={canal}
              onEditar={() => {
                setCanalEditando(canal)
                setFormularioCanalAberto(true)
              }}
            />
          ))}
        </div>

        {canaisArquivados.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {canaisArquivados.map((canal) => (
              <CardCanal
                key={canal.id}
                canal={canal}
                onEditar={() => {
                  setCanalEditando(canal)
                  setFormularioCanalAberto(true)
                }}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center pt-1 sm:hidden">
          <Button variant="ghost" size="sm" onClick={abrirNovoCanal} className="gap-2">
            <Plus className="size-4" aria-hidden />
            Novo canal
          </Button>
        </div>
      </div>

      {/* FAB — só no celular; no desktop os botões ficam nos cabeçalhos das seções */}
      <Button
        type="button"
        onClick={abrirNovoCusto}
        size="icon-lg"
        className="fixed right-4 bottom-20 z-10 size-14 rounded-full shadow-lg sm:hidden"
        aria-label="Novo custo fixo"
      >
        <Plus className="size-6" aria-hidden />
      </Button>

      <FormularioCustoFixoDialog
        aberto={formularioCustoAberto}
        onFechar={() => setFormularioCustoAberto(false)}
        custoFixo={custoEditando}
      />

      <FormularioCanalDialog
        aberto={formularioCanalAberto}
        onFechar={() => setFormularioCanalAberto(false)}
        canal={canalEditando}
      />
    </section>
  )
}
