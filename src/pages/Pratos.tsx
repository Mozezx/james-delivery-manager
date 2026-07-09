import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import FotoPrato from '@/components/pratos/FotoPrato'
import { usePratos } from '@/hooks/usePratos'
import { useInsumos } from '@/hooks/useInsumos'
import { custoPorPorcao } from '@/lib/calculos'
import { cn } from '@/lib/utils'
import type { PratoComItens } from '@/lib/pratos'
import type { Insumo } from '@/lib/tipos'

function custoDoPrato(prato: PratoComItens, insumos: Insumo[]): number {
  const porId = new Map(insumos.map((insumo) => [insumo.id, insumo]))
  const itens = prato.itens_ficha.flatMap((item) => {
    const insumo = porId.get(item.insumo_id)
    return insumo ? [{ quantidade_pronta: item.quantidade_pronta, insumo }] : []
  })
  return custoPorPorcao(itens, prato.rende_porcoes)
}

export default function Pratos() {
  const { data: pratos, isLoading, isError } = usePratos()
  const { data: insumos } = useInsumos()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)

  const categorias = useMemo(() => {
    const nomes = (pratos ?? [])
      .filter((prato) => prato.ativo && prato.categoria)
      .map((prato) => prato.categoria as string)
    return [...new Set(nomes)].sort()
  }, [pratos])

  const visiveis = (pratos ?? []).filter(
    (prato) =>
      prato.ativo &&
      prato.nome.toLowerCase().includes(busca.toLowerCase()) &&
      (categoria === null || prato.categoria === categoria)
  )

  return (
    <section>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Pratos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Fichas técnicas com custo por porção ao vivo.
          </p>
        </div>
        <Button asChild className="hidden h-9 md:inline-flex">
          <Link to="/pratos/novo">
            <Plus className="size-4" aria-hidden /> Prato
          </Link>
        </Button>
      </header>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar prato..."
          className="h-12 pl-9 md:h-9"
        />
      </div>

      {categorias.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoria(null)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              categoria === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground'
            )}
          >
            Todas
          </button>
          {categorias.map((nome) => (
            <button
              key={nome}
              type="button"
              onClick={() => setCategoria(categoria === nome ? null : nome)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                categoria === nome
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground'
              )}
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <p className="mt-8 text-center text-sm text-muted-foreground">Carregando...</p>
      )}
      {isError && (
        <p className="mt-8 text-center text-sm text-destructive">
          Não deu para carregar os pratos. Verifique a conexão.
        </p>
      )}
      {!isLoading && !isError && visiveis.length === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {busca || categoria
              ? 'Nenhum prato encontrado com esse filtro.'
              : 'Nenhum prato ainda. Crie o primeiro — a Marmita Padrão do seed aparece aqui depois do SQL aplicado.'}
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visiveis.map((prato) => (
          <Link key={prato.id} to={`/pratos/${prato.id}`} className="group">
            <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-3">
                <FotoPrato
                  caminho={prato.foto_url}
                  nome={prato.nome}
                  className="size-16 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{prato.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {prato.categoria ?? 'Sem categoria'}
                    {prato.rende_porcoes > 1 && ` · rende ${prato.rende_porcoes}`}
                  </p>
                </div>
                <div className="text-right">
                  {insumos ? (
                    <Dinheiro valor={custoDoPrato(prato, insumos)} tamanho="md" tom="custo" />
                  ) : (
                    <span className="text-sm text-muted-foreground">…</span>
                  )}
                  <p className="text-[11px] text-muted-foreground">por porção</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* FAB no celular */}
      <Button
        asChild
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-10 size-14 rounded-full shadow-lg md:hidden"
      >
        <Link to="/pratos/novo" aria-label="Novo prato">
          <Plus className="size-6" aria-hidden />
        </Link>
      </Button>
    </section>
  )
}
