import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Camera, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import CampoQuantidade from '@/components/CampoQuantidade'
import FotoPrato from '@/components/pratos/FotoPrato'
import {
  usePrato,
  useCriarPrato,
  useAtualizarPrato,
  useArquivarPrato,
  useSalvarItemFicha,
  useRemoverItemFicha,
  useCategorias,
} from '@/hooks/usePratos'
import { useInsumos } from '@/hooks/useInsumos'
import { enviarFotoPrato, removerFotoPrato } from '@/lib/fotos'
import { custoDireto, custoItemFicha, quantidadeCrua } from '@/lib/calculos'
import { formatarDinheiro, lerDecimal } from '@/lib/formato'
import type { Insumo } from '@/lib/tipos'

export default function EditorPrato() {
  const { id } = useParams()
  const novo = id === 'novo'
  const navigate = useNavigate()

  const { data: prato, isLoading } = usePrato(novo ? undefined : id)
  const { data: insumos } = useInsumos()
  const { data: categorias } = useCategorias()

  const criar = useCriarPrato()
  const atualizar = useAtualizarPrato()
  const arquivar = useArquivarPrato()
  const salvarItem = useSalvarItemFicha()
  const removerItem = useRemoverItemFicha()

  // Cabeçalho (controlado localmente; sincroniza quando o prato carrega)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [rendePorcoes, setRendePorcoes] = useState('1')
  // Quantidades dos itens como texto (edição inline com vírgula)
  const [qtds, setQtds] = useState<Record<string, string>>({})
  const [buscaInsumo, setBuscaInsumo] = useState('')
  const [novoInsumoId, setNovoInsumoId] = useState<string | null>(null)
  const [novaQtd, setNovaQtd] = useState('')
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const inputFoto = useRef<HTMLInputElement>(null)

  // Inicializa o formulário só quando MUDA de prato. Em refetch do mesmo
  // prato (após salvar um item), apenas acrescenta/remove chaves de qtds —
  // nunca sobrescreve o que o usuário está digitando em outro campo.
  const pratoCarregado = useRef<string | null>(null)
  useEffect(() => {
    if (!prato) return
    if (pratoCarregado.current !== prato.id) {
      pratoCarregado.current = prato.id
      setNome(prato.nome)
      setCategoria(prato.categoria ?? '')
      setRendePorcoes(String(prato.rende_porcoes))
      setQtds(
        Object.fromEntries(
          prato.itens_ficha.map((item) => [
            item.insumo_id,
            String(item.quantidade_pronta).replace('.', ','),
          ])
        )
      )
      return
    }
    setQtds((atual) => {
      const proximo = { ...atual }
      for (const item of prato.itens_ficha) {
        if (!(item.insumo_id in proximo)) {
          proximo[item.insumo_id] = String(item.quantidade_pronta).replace('.', ',')
        }
      }
      for (const chave of Object.keys(proximo)) {
        if (!prato.itens_ficha.some((item) => item.insumo_id === chave)) {
          delete proximo[chave]
        }
      }
      return proximo
    })
  }, [prato])

  const insumosPorId = useMemo(
    () => new Map((insumos ?? []).map((insumo) => [insumo.id, insumo])),
    [insumos]
  )

  // Itens com quantidade ao vivo (do estado local) para o rodapé
  const itensAoVivo = useMemo(() => {
    if (!prato) return []
    return prato.itens_ficha.flatMap((item) => {
      const insumo = insumosPorId.get(item.insumo_id)
      if (!insumo) return []
      const qtd = lerDecimal(qtds[item.insumo_id] ?? '') ?? item.quantidade_pronta
      return [{ item, insumo, quantidadePronta: qtd }]
    })
  }, [prato, insumosPorId, qtds])

  const custoLote = custoDireto(
    itensAoVivo.map(({ quantidadePronta, insumo }) => ({
      quantidade_pronta: quantidadePronta,
      insumo,
    }))
  )
  const rendeLido = lerDecimal(rendePorcoes)
  const rendeValido =
    rendeLido !== null && Number.isInteger(rendeLido) && rendeLido >= 1
  // enquanto o campo está inválido/no meio da digitação, calcula com o valor salvo
  const rende = rendeValido ? rendeLido : (prato?.rende_porcoes ?? 1)
  const custoPorcao = custoLote / rende

  const cabecalhoMudou =
    prato !== undefined &&
    (nome !== prato.nome ||
      (categoria || null) !== prato.categoria ||
      rende !== prato.rende_porcoes)

  function validarCabecalho(): boolean {
    if (!nome.trim()) {
      toast.error('Dê um nome ao prato.')
      return false
    }
    if (!rendeValido) {
      toast.error('Rende deve ser um número inteiro: 1, 2, 8...')
      return false
    }
    return true
  }

  function criarPratoNovo() {
    if (!validarCabecalho()) return
    criar.mutate(
      {
        nome: nome.trim(),
        categoria: categoria.trim() || null,
        foto_url: null,
        rende_porcoes: rende,
        margem_alvo_pct: null,
      },
      {
        onSuccess: (criado) => {
          toast.success('Prato criado. Agora adicione os insumos.')
          navigate(`/pratos/${criado.id}`, { replace: true })
        },
        onError: () => toast.error('Não deu para criar o prato. Tenta de novo.'),
      }
    )
  }

  function salvarCabecalho() {
    if (!prato || !validarCabecalho()) return
    atualizar.mutate(
      {
        id: prato.id,
        campos: {
          nome: nome.trim(),
          categoria: categoria.trim() || null,
          rende_porcoes: rende,
        },
      },
      {
        onSuccess: () => toast.success('Prato salvo.'),
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      }
    )
  }

  function salvarQuantidade(insumoId: string) {
    if (!prato) return
    const item = prato.itens_ficha.find((i) => i.insumo_id === insumoId)
    const qtd = lerDecimal(qtds[insumoId] ?? '')
    if (qtd === null || qtd <= 0) {
      toast.error('Quantidade inválida.')
      if (item) {
        setQtds((atual) => ({
          ...atual,
          [insumoId]: String(item.quantidade_pronta).replace('.', ','),
        }))
      }
      return
    }
    if (item && qtd === item.quantidade_pronta) return
    salvarItem.mutate(
      { pratoId: prato.id, insumoId, quantidadePronta: qtd },
      { onError: () => toast.error('Não deu para salvar a quantidade.') }
    )
  }

  function adicionarItem() {
    if (!prato || !novoInsumoId) return
    const qtd = lerDecimal(novaQtd)
    if (qtd === null || qtd <= 0) {
      toast.error('Informe a quantidade pronta.')
      return
    }
    salvarItem.mutate(
      { pratoId: prato.id, insumoId: novoInsumoId, quantidadePronta: qtd },
      {
        onSuccess: () => {
          setNovoInsumoId(null)
          setNovaQtd('')
          setBuscaInsumo('')
        },
        onError: () => toast.error('Não deu para adicionar o insumo.'),
      }
    )
  }

  async function trocarFoto(arquivo: File) {
    if (!prato) return
    setEnviandoFoto(true)
    let caminho: string | null = null
    try {
      caminho = await enviarFotoPrato(arquivo)
      const anterior = prato.foto_url
      await new Promise<void>((resolver, rejeitar) =>
        atualizar.mutate(
          { id: prato.id, campos: { foto_url: caminho } },
          { onSuccess: () => resolver(), onError: (e) => rejeitar(e) }
        )
      )
      if (anterior) await removerFotoPrato(anterior)
      toast.success('Foto atualizada.')
    } catch {
      // não deixa arquivo órfão no Storage se o update do prato falhou
      if (caminho) await removerFotoPrato(caminho)
      toast.error('Não deu para enviar a foto. Tenta de novo.')
    } finally {
      setEnviandoFoto(false)
    }
  }

  const candidatos: Insumo[] = (insumos ?? []).filter(
    (insumo) =>
      insumo.ativo &&
      !prato?.itens_ficha.some((item) => item.insumo_id === insumo.id) &&
      insumo.nome.toLowerCase().includes(buscaInsumo.toLowerCase())
  )

  if (!novo && isLoading) {
    return <p className="mt-8 text-center text-sm text-muted-foreground">Carregando...</p>
  }
  if (!novo && !isLoading && !prato) {
    return (
      <p className="mt-8 text-center text-sm text-destructive">Prato não encontrado.</p>
    )
  }

  return (
    <section className="pb-32">
      <Link
        to="/pratos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Pratos
      </Link>

      <div className="mt-3 flex items-start gap-4">
        {!novo && prato && (
          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            className="relative shrink-0"
            aria-label="Trocar foto do prato"
          >
            <FotoPrato
              caminho={prato.foto_url}
              nome={prato.nome}
              className="size-20 rounded-xl"
            />
            <span className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Camera className="size-3.5" aria-hidden />
            </span>
            {enviandoFoto && (
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/40 text-[10px] font-semibold text-card">
                Enviando...
              </span>
            )}
          </button>
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="prato-nome">Nome do prato</Label>
            <Input
              id="prato-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Marmita de frango"
              className="h-12 md:h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prato-categoria">Categoria</Label>
              <Input
                id="prato-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="marmita"
                list="categorias-existentes"
                className="h-12 md:h-9"
              />
              <datalist id="categorias-existentes">
                {(categorias ?? []).map((nomeCat) => (
                  <option key={nomeCat} value={nomeCat} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prato-rende">Rende (porções)</Label>
              <CampoQuantidade
                id="prato-rende"
                valor={rendePorcoes}
                onChange={setRendePorcoes}
                unidade="porções"
              />
            </div>
          </div>
        </div>
      </div>

      {/* sem `capture`: deixa escolher entre câmera e galeria */}
      <input
        ref={inputFoto}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) trocarFoto(arquivo)
          e.target.value = ''
        }}
      />

      {novo ? (
        <Button
          onClick={criarPratoNovo}
          disabled={criar.isPending}
          className="mt-4 h-12 w-full md:w-auto"
        >
          {criar.isPending ? 'Criando...' : 'Criar prato e montar a ficha'}
        </Button>
      ) : (
        cabecalhoMudou && (
          <Button
            onClick={salvarCabecalho}
            disabled={atualizar.isPending}
            className="mt-4 h-12 w-full md:h-9 md:w-auto"
          >
            {atualizar.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        )
      )}

      {!novo && prato && (
        <>
          <h2 className="mt-8 text-lg font-semibold">
            {prato.rende_porcoes > 1 ? 'O que entra na panela' : 'O que entra no prato'}
          </h2>
          <div className="mt-3 space-y-2">
            {itensAoVivo.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum insumo ainda — adicione abaixo.
                </CardContent>
              </Card>
            )}
            {itensAoVivo.map(({ item, insumo, quantidadePronta }) => (
              <Card key={item.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{insumo.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {insumo.fator_rendimento !== 1 && (
                        <>
                          usa ~
                          {Math.round(
                            quantidadeCrua(quantidadePronta, insumo.fator_rendimento)
                          )}
                          {insumo.unidade} crua ·{' '}
                        </>
                      )}
                      {formatarDinheiro(custoItemFicha(quantidadePronta, insumo))}
                    </p>
                  </div>
                  <CampoQuantidade
                    valor={qtds[item.insumo_id] ?? ''}
                    onChange={(texto) =>
                      setQtds((atual) => ({ ...atual, [item.insumo_id]: texto }))
                    }
                    onBlur={() => salvarQuantidade(item.insumo_id)}
                    unidade={insumo.unidade}
                    className="w-28"
                  />
                  <Button
                    variant="ghost"
                    className="size-11 shrink-0 p-0 text-muted-foreground hover:text-destructive md:size-8"
                    aria-label={`Remover ${insumo.nome}`}
                    onClick={() =>
                      removerItem.mutate(
                        { pratoId: prato.id, insumoId: item.insumo_id },
                        { onError: () => toast.error('Não deu para remover.') }
                      )
                    }
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold">Adicionar insumo</h2>
          <div className="mt-3 space-y-2">
            <Input
              value={buscaInsumo}
              onChange={(e) => {
                setBuscaInsumo(e.target.value)
                setNovoInsumoId(null)
              }}
              placeholder="Buscar insumo ativo..."
              className="h-12 md:h-9"
            />
            {buscaInsumo && !novoInsumoId && (
              <div className="overflow-hidden rounded-lg border bg-card">
                {candidatos.length === 0 && (
                  <p className="px-3 py-3 text-sm text-muted-foreground">
                    Nenhum insumo ativo com esse nome. Cadastre em Insumos.
                  </p>
                )}
                {candidatos.slice(0, 6).map((insumo) => (
                  <button
                    key={insumo.id}
                    type="button"
                    onClick={() => {
                      setNovoInsumoId(insumo.id)
                      setBuscaInsumo(insumo.nome)
                    }}
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{insumo.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      fator {String(insumo.fator_rendimento).replace('.', ',')}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {novoInsumoId && (
              <div className="flex items-center gap-2">
                <CampoQuantidade
                  valor={novaQtd}
                  onChange={setNovaQtd}
                  unidade={insumosPorId.get(novoInsumoId)?.unidade ?? ''}
                  className="flex-1"
                />
                <Button onClick={adicionarItem} disabled={salvarItem.isPending} className="h-12 md:h-9">
                  <Plus className="size-4" aria-hidden /> Adicionar
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Quantidade sempre do jeito que vai PRONTA no prato — a conversão para
              cru é automática pelo fator de rendimento.
            </p>
          </div>

          <div className="mt-8">
            <Button
              variant="outline"
              className="h-11 md:h-9"
              onClick={() =>
                arquivar.mutate(
                  { id: prato.id, ativo: !prato.ativo },
                  {
                    onSuccess: () => {
                      toast.success(prato.ativo ? 'Prato arquivado.' : 'Prato reativado.')
                      if (prato.ativo) navigate('/pratos')
                    },
                    onError: () => toast.error('Não deu. Tenta de novo.'),
                  }
                )
              }
            >
              {prato.ativo ? 'Arquivar prato' : 'Reativar prato'}
            </Button>
          </div>

          {/* Rodapé fixo: o número que importa (offset respeita a safe-area do iPhone) */}
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t bg-card/95 backdrop-blur md:bottom-0">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
              {rende > 1 ? (
                <>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Custo da panela
                    </p>
                    <Dinheiro valor={custoLote} tamanho="md" tom="custo" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Por porção (÷{rende})
                    </p>
                    <Dinheiro valor={custoPorcao} tamanho="lg" tom="custo" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    Custo direto da porção
                  </p>
                  <Dinheiro valor={custoPorcao} tamanho="lg" tom="custo" />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

