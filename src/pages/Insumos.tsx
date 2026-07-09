import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useInsumos } from '@/hooks/useInsumos'
import CardInsumo from '@/components/insumos/CardInsumo'
import FormularioInsumoDialog from '@/components/insumos/FormularioInsumoDialog'
import DialogRegistrarCompra from '@/components/insumos/DialogRegistrarCompra'
import type { Insumo } from '@/lib/tipos'

export default function Insumos() {
  const { data: insumos, isLoading, isError } = useInsumos()
  const [busca, setBusca] = useState('')
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null)
  const [formularioAberto, setFormularioAberto] = useState(false)
  const [insumoComprando, setInsumoComprando] = useState<Insumo | null>(null)

  const filtrados = useMemo(() => {
    if (!insumos) return []
    const buscaLimpa = busca.trim().toLowerCase()
    return insumos
      .filter((i) => (mostrarArquivados ? true : i.ativo))
      .filter((i) => i.nome.toLowerCase().includes(buscaLimpa))
  }, [insumos, busca, mostrarArquivados])

  function abrirNovo() {
    setInsumoEditando(null)
    setFormularioAberto(true)
  }

  function abrirEdicao(insumo: Insumo) {
    setInsumoEditando(insumo)
    setFormularioAberto(true)
  }

  return (
    <section className="space-y-4 pb-20">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Insumos</h1>
          <p className="text-sm text-muted-foreground">
            Custos base para as fichas técnicas dos pratos.
          </p>
        </div>
        <Button onClick={abrirNovo} className="hidden h-10 gap-2 sm:inline-flex">
          <Plus className="size-4" aria-hidden />
          Novo insumo
        </Button>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar insumo..."
          className="h-12 pl-10 md:h-9"
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {isError && (
        <p className="text-sm text-destructive">
          Não deu para carregar os insumos. Verifique a conexão e recarregue a página.
        </p>
      )}

      {!isLoading && !isError && filtrados.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {busca ? 'Nenhum insumo encontrado.' : 'Nenhum insumo cadastrado ainda.'}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((insumo) => (
          <CardInsumo
            key={insumo.id}
            insumo={insumo}
            onEditar={() => abrirEdicao(insumo)}
            onRegistrarCompra={() => setInsumoComprando(insumo)}
          />
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="sm" onClick={() => setMostrarArquivados((v) => !v)}>
          {mostrarArquivados ? 'Ocultar arquivados' : 'Mostrar arquivados'}
        </Button>
      </div>

      {/* FAB — só no celular; no desktop o botão fica no cabeçalho */}
      <Button
        type="button"
        onClick={abrirNovo}
        size="icon-lg"
        className="fixed right-4 bottom-20 z-10 size-14 rounded-full shadow-lg sm:hidden"
        aria-label="Novo insumo"
      >
        <Plus className="size-6" aria-hidden />
      </Button>

      <FormularioInsumoDialog
        aberto={formularioAberto}
        onFechar={() => setFormularioAberto(false)}
        insumo={insumoEditando}
      />

      <DialogRegistrarCompra insumo={insumoComprando} onFechar={() => setInsumoComprando(null)} />
    </section>
  )
}
