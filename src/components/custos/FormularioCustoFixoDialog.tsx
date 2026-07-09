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
import CampoDinheiro from '@/components/CampoDinheiro'
import { lerDecimal } from '@/lib/formato'
import {
  useAtualizarCustoFixo,
  useArquivarCustoFixo,
  useCriarCustoFixo,
  useExcluirCustoFixo,
} from '@/hooks/useCustosFixos'
import type { CustoFixo } from '@/lib/tipos'

export default function FormularioCustoFixoDialog({
  aberto,
  onFechar,
  custoFixo,
}: {
  aberto: boolean
  onFechar: () => void
  custoFixo: CustoFixo | null
}) {
  const editando = custoFixo !== null

  const [nome, setNome] = useState('')
  const [valorMensal, setValorMensal] = useState('')

  const criar = useCriarCustoFixo()
  const atualizar = useAtualizarCustoFixo()
  const arquivar = useArquivarCustoFixo()
  const excluir = useExcluirCustoFixo()

  // Preenche o formulário ao abrir (edição carrega os dados; criação zera).
  useEffect(() => {
    if (!aberto) return
    if (custoFixo) {
      setNome(custoFixo.nome)
      setValorMensal(String(custoFixo.valor_mensal).replace('.', ','))
    } else {
      setNome('')
      setValorMensal('')
    }
  }, [custoFixo, aberto])

  const salvando = criar.isPending || atualizar.isPending

  function salvar() {
    if (!nome.trim()) {
      toast.error('Dê um nome ao custo fixo.')
      return
    }
    const valorLido = lerDecimal(valorMensal)
    if (valorLido === null || valorLido <= 0) {
      toast.error('Valor mensal inválido.')
      return
    }

    const dados = { nome: nome.trim(), valor_mensal: valorLido }

    if (custoFixo) {
      atualizar.mutate(
        { id: custoFixo.id, campos: dados },
        {
          onSuccess: () => {
            toast.success('Custo fixo atualizado.')
            onFechar()
          },
          onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
        }
      )
    } else {
      criar.mutate(dados, {
        onSuccess: () => {
          toast.success('Custo fixo cadastrado.')
          onFechar()
        },
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      })
    }
  }

  function alternarArquivo() {
    if (!custoFixo) return
    arquivar.mutate(
      { id: custoFixo.id, ativo: !custoFixo.ativo },
      {
        onSuccess: () => {
          toast.success(custoFixo.ativo ? 'Custo fixo arquivado.' : 'Custo fixo reativado.')
          onFechar()
        },
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      }
    )
  }

  function excluirDeVez() {
    if (!custoFixo) return
    if (!window.confirm(`Excluir "${custoFixo.nome}" definitivamente? Não dá para desfazer.`)) {
      return
    }
    excluir.mutate(custoFixo.id, {
      onSuccess: () => {
        toast.success('Custo fixo excluído.')
        onFechar()
      },
      onError: () => toast.error('Não deu para excluir. Tenta de novo.'),
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={(novoAberto) => !novoAberto && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar custo fixo' : 'Novo custo fixo'}</DialogTitle>
          <DialogDescription>
            Entra na soma que é rateada por marmita vendida.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="custo-nome">Nome</Label>
            <Input
              id="custo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Aluguel da moto"
              className="h-12 md:h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custo-valor">Valor mensal</Label>
            <CampoDinheiro id="custo-valor" valor={valorMensal} onChange={setValorMensal} />
          </div>

          {custoFixo && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={alternarArquivo}>
                {custoFixo.ativo ? 'Arquivar' : 'Reativar'}
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={excluirDeVez}>
                Excluir de vez
              </Button>
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
