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
import CampoQuantidade from '@/components/CampoQuantidade'
import { lerDecimal } from '@/lib/formato'
import {
  useAtualizarCanal,
  useArquivarCanal,
  useCriarCanal,
  useExcluirCanal,
  useCanalEmUso,
} from '@/hooks/useCanais'
import type { Canal } from '@/lib/tipos'

export default function FormularioCanalDialog({
  aberto,
  onFechar,
  canal,
}: {
  aberto: boolean
  onFechar: () => void
  canal: Canal | null
}) {
  const editando = canal !== null

  const [nome, setNome] = useState('')
  const [comissaoPct, setComissaoPct] = useState('')
  const [taxaPagamentoPct, setTaxaPagamentoPct] = useState('')

  const criar = useCriarCanal()
  const atualizar = useAtualizarCanal()
  const arquivar = useArquivarCanal()
  const excluir = useExcluirCanal()
  const { data: emUso } = useCanalEmUso(canal?.id, editando && aberto)

  // Preenche o formulário ao abrir (edição carrega os dados; criação zera).
  useEffect(() => {
    if (!aberto) return
    if (canal) {
      setNome(canal.nome)
      setComissaoPct(String(canal.comissao_pct).replace('.', ','))
      setTaxaPagamentoPct(String(canal.taxa_pagamento_pct).replace('.', ','))
    } else {
      setNome('')
      setComissaoPct('0')
      setTaxaPagamentoPct('0')
    }
  }, [canal, aberto])

  const salvando = criar.isPending || atualizar.isPending

  function salvar() {
    if (!nome.trim()) {
      toast.error('Dê um nome ao canal.')
      return
    }
    const comissaoLida = lerDecimal(comissaoPct)
    const taxaLida = lerDecimal(taxaPagamentoPct)
    if (comissaoLida === null || comissaoLida < 0) {
      toast.error('Comissão inválida.')
      return
    }
    if (taxaLida === null || taxaLida < 0) {
      toast.error('Taxa de pagamento inválida.')
      return
    }
    if (comissaoLida + taxaLida >= 100) {
      toast.error('Comissão + taxa não pode chegar a 100%.')
      return
    }

    const dados = {
      nome: nome.trim(),
      comissao_pct: comissaoLida,
      taxa_pagamento_pct: taxaLida,
    }

    if (canal) {
      atualizar.mutate(
        { id: canal.id, campos: dados },
        {
          onSuccess: () => {
            toast.success('Canal atualizado.')
            onFechar()
          },
          onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
        }
      )
    } else {
      criar.mutate(dados, {
        onSuccess: () => {
          toast.success('Canal cadastrado.')
          onFechar()
        },
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      })
    }
  }

  function alternarArquivo() {
    if (!canal) return
    arquivar.mutate(
      { id: canal.id, ativo: !canal.ativo },
      {
        onSuccess: () => {
          toast.success(canal.ativo ? 'Canal arquivado.' : 'Canal reativado.')
          onFechar()
        },
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      }
    )
  }

  function excluirDeVez() {
    if (!canal) return
    if (!window.confirm(`Excluir "${canal.nome}" definitivamente? Não dá para desfazer.`)) {
      return
    }
    excluir.mutate(canal.id, {
      onSuccess: () => {
        toast.success('Canal excluído.')
        onFechar()
      },
      onError: () =>
        toast.error(
          'Não deu para excluir — o canal tem vendas registradas. Arquive em vez de excluir.'
        ),
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={(novoAberto) => !novoAberto && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar canal' : 'Novo canal'}</DialogTitle>
          <DialogDescription>
            Comissão e taxa de pagamento incidem sobre o preço, não sobre o custo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="canal-nome">Nome</Label>
            <Input
              id="canal-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="iFood"
              className="h-12 md:h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="canal-comissao">Comissão</Label>
              <CampoQuantidade
                id="canal-comissao"
                valor={comissaoPct}
                onChange={setComissaoPct}
                unidade="%"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="canal-taxa">Taxa de pagamento</Label>
              <CampoQuantidade
                id="canal-taxa"
                valor={taxaPagamentoPct}
                onChange={setTaxaPagamentoPct}
                unidade="%"
              />
            </div>
          </div>

          {canal && (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={alternarArquivo}>
                {canal.ativo ? 'Arquivar' : 'Reativar'}
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
