import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CampoDinheiro from '@/components/CampoDinheiro'
import CampoQuantidade from '@/components/CampoQuantidade'
import CampoFatorRendimento from '@/components/insumos/CampoFatorRendimento'
import { formatarDinheiro, lerDecimal } from '@/lib/formato'
import { custoPorUnidade } from '@/lib/calculos'
import {
  useAtualizarInsumo,
  useArquivarInsumo,
  useCriarInsumo,
  useExcluirInsumo,
  useInsumoEmUso,
} from '@/hooks/useInsumos'
import type { Insumo, Unidade } from '@/lib/tipos'

const sufixoUnidade: Record<Unidade, string> = {
  g: 'g crua',
  ml: 'ml cru',
  un: 'unidade',
}

export default function FormularioInsumoDialog({
  aberto,
  onFechar,
  insumo,
}: {
  aberto: boolean
  onFechar: () => void
  insumo: Insumo | null
}) {
  const editando = insumo !== null

  const [nome, setNome] = useState('')
  const [precoPago, setPrecoPago] = useState('')
  const [quantidadeComprada, setQuantidadeComprada] = useState('')
  const [unidade, setUnidade] = useState<Unidade>('g')
  const [digitadoEmMil, setDigitadoEmMil] = useState(false)
  const [fatorRendimento, setFatorRendimento] = useState('1')

  const criar = useCriarInsumo()
  const atualizar = useAtualizarInsumo()
  const arquivar = useArquivarInsumo()
  const excluir = useExcluirInsumo()
  const { data: emUso } = useInsumoEmUso(insumo?.id, editando && aberto)

  // Preenche o formulário ao abrir (edição carrega os dados; criação zera).
  useEffect(() => {
    if (!aberto) return
    if (insumo) {
      setNome(insumo.nome)
      setPrecoPago(String(insumo.preco_pago).replace('.', ','))
      setQuantidadeComprada(String(insumo.quantidade_comprada).replace('.', ','))
      setUnidade(insumo.unidade)
      setDigitadoEmMil(false)
      setFatorRendimento(String(insumo.fator_rendimento).replace('.', ','))
    } else {
      setNome('')
      setPrecoPago('')
      setQuantidadeComprada('')
      setUnidade('g')
      setDigitadoEmMil(false)
      setFatorRendimento('1')
    }
  }, [insumo, aberto])

  const precoLido = lerDecimal(precoPago)
  const quantidadeLida = lerDecimal(quantidadeComprada)
  const quantidadeBase =
    quantidadeLida !== null && digitadoEmMil ? quantidadeLida * 1000 : quantidadeLida
  const fatorLido = lerDecimal(fatorRendimento)
  const custoUnitario =
    precoLido !== null && quantidadeBase !== null && quantidadeBase > 0
      ? custoPorUnidade(precoLido, quantidadeBase)
      : null

  const salvando = criar.isPending || atualizar.isPending

  function salvar() {
    if (!nome.trim()) {
      toast.error('Dê um nome ao insumo.')
      return
    }
    if (precoLido === null || precoLido <= 0) {
      toast.error('Preço pago inválido.')
      return
    }
    if (quantidadeBase === null || quantidadeBase <= 0) {
      toast.error('Quantidade comprada inválida.')
      return
    }
    if (fatorLido === null || fatorLido <= 0) {
      toast.error('Fator de rendimento inválido.')
      return
    }
    // domínio real do fator é ~0,1–4; um "2.200" digitado com ponto viraria
    // 2200 (regra de milhar) e zeraria o custo nas fichas
    if (fatorLido < 0.05 || fatorLido > 10) {
      toast.error('Fator fora do normal (0,05 a 10). Use vírgula: ex. 2,2.')
      return
    }

    const dados = {
      nome: nome.trim(),
      preco_pago: precoLido,
      quantidade_comprada: quantidadeBase,
      unidade,
      fator_rendimento: fatorLido,
    }

    if (insumo) {
      atualizar.mutate(
        { id: insumo.id, campos: dados },
        {
          onSuccess: () => {
            toast.success('Insumo atualizado.')
            onFechar()
          },
          onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
        }
      )
    } else {
      criar.mutate(dados, {
        onSuccess: () => {
          toast.success('Insumo cadastrado.')
          onFechar()
        },
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      })
    }
  }

  function alternarArquivo() {
    if (!insumo) return
    arquivar.mutate(
      { id: insumo.id, ativo: !insumo.ativo },
      {
        onSuccess: () => {
          toast.success(insumo.ativo ? 'Insumo arquivado.' : 'Insumo reativado.')
          onFechar()
        },
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      }
    )
  }

  function excluirDeVez() {
    if (!insumo) return
    if (!window.confirm(`Excluir "${insumo.nome}" definitivamente? Não dá para desfazer.`)) {
      return
    }
    excluir.mutate(insumo.id, {
      onSuccess: () => {
        toast.success('Insumo excluído.')
        onFechar()
      },
      onError: () =>
        toast.error(
          'Não deu para excluir — o insumo está em alguma ficha técnica. Arquive em vez de excluir.'
        ),
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={(novoAberto) => !novoAberto && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar insumo' : 'Novo insumo'}</DialogTitle>
          <DialogDescription>
            Preço e quantidade da última compra — o app calcula o custo por unidade.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="insumo-nome">Nome</Label>
            <Input
              id="insumo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Frango coxa"
              className="h-12 md:h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="insumo-preco">Preço pago</Label>
              <CampoDinheiro id="insumo-preco" valor={precoPago} onChange={setPrecoPago} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insumo-unidade">Unidade</Label>
              <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                <SelectTrigger id="insumo-unidade" className="h-12 w-full md:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="un">un</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insumo-qtd">Quantidade comprada</Label>
            <CampoQuantidade
              id="insumo-qtd"
              valor={quantidadeComprada}
              onChange={setQuantidadeComprada}
              unidade={unidade}
            />
            {unidade !== 'un' && (
              <Button
                type="button"
                variant={digitadoEmMil ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDigitadoEmMil((v) => !v)}
              >
                Digitei em {unidade === 'g' ? 'kg' : 'L'} (×1000)
              </Button>
            )}
            {digitadoEmMil && quantidadeBase !== null && (
              <p className="text-xs text-muted-foreground">
                = {quantidadeBase} {unidade}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Fator de rendimento</Label>
            <CampoFatorRendimento valor={fatorRendimento} onChange={setFatorRendimento} />
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            {custoUnitario !== null ? (
              <span>
                → <strong className="tabular-nums text-custo">{formatarDinheiro(custoUnitario)}</strong>{' '}
                por {sufixoUnidade[unidade]}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Preencha preço e quantidade para ver o custo por unidade.
              </span>
            )}
          </div>

          {insumo && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={alternarArquivo}>
                {insumo.ativo ? 'Arquivar' : 'Reativar'}
              </Button>
              {emUso === false && (
                <Button type="button" variant="destructive" size="sm" onClick={excluirDeVez}>
                  Excluir de vez
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="h-12 md:h-9" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="button" className="h-12 md:h-9" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
