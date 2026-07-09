import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import CampoDinheiro from '@/components/CampoDinheiro'
import CampoQuantidade from '@/components/CampoQuantidade'
import { formatarDinheiro, formatarPercentual, lerDecimal } from '@/lib/formato'
import { custoPorUnidade } from '@/lib/calculos'
import { useRegistrarCompra } from '@/hooks/useInsumos'
import type { Insumo } from '@/lib/tipos'

/**
 * Dialog de "+ compra": só dois campos (preço + quantidade), sem histórico —
 * o registro sobrescreve preco_pago/quantidade_comprada do insumo (decisão
 * do plano-03: "sem histórico de compras no MVP").
 */
export default function DialogRegistrarCompra({
  insumo: insumoProp,
  onFechar,
}: {
  insumo: Insumo | null
  onFechar: () => void
}) {
  const [precoPago, setPrecoPago] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [digitadoEmMil, setDigitadoEmMil] = useState(false)
  const registrar = useRegistrarCompra()

  if (!insumoProp) return null
  // Alias const: preserva o narrowing de "não-nulo" dentro das funções
  // aninhadas abaixo (salvar, limparEFechar), que o TS não propaga do
  // parâmetro original através de closures.
  const insumo = insumoProp

  const custoAntigo = custoPorUnidade(insumo.preco_pago, insumo.quantidade_comprada)
  const precoLido = lerDecimal(precoPago)
  const quantidadeLida = lerDecimal(quantidade)
  // mesmo atalho kg/L do formulário principal — sem ele, "5" (querendo 5 kg)
  // gravaria custo 1000× maior em todas as fichas
  const quantidadeBase =
    quantidadeLida !== null && digitadoEmMil ? quantidadeLida * 1000 : quantidadeLida
  const custoNovo =
    precoLido !== null && quantidadeBase !== null && quantidadeBase > 0
      ? custoPorUnidade(precoLido, quantidadeBase)
      : null
  const variacao =
    custoNovo !== null && custoAntigo > 0 ? (custoNovo - custoAntigo) / custoAntigo : null

  function limparEFechar() {
    setPrecoPago('')
    setQuantidade('')
    setDigitadoEmMil(false)
    onFechar()
  }

  function salvar() {
    if (precoLido === null || precoLido <= 0) {
      toast.error('Preço pago inválido.')
      return
    }
    if (quantidadeBase === null || quantidadeBase <= 0) {
      toast.error('Quantidade inválida.')
      return
    }
    registrar.mutate(
      { id: insumo.id, precoPago: precoLido, quantidadeComprada: quantidadeBase },
      {
        onSuccess: () => {
          toast.success('Compra registrada.')
          limparEFechar()
        },
        onError: () => toast.error('Não deu para salvar. Tenta de novo.'),
      }
    )
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && limparEFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar compra — {insumo.nome}</DialogTitle>
          <DialogDescription>
            Atualiza o preço e a quantidade da última compra.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="compra-preco">Preço pago</Label>
            <CampoDinheiro id="compra-preco" valor={precoPago} onChange={setPrecoPago} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compra-qtd">Quantidade ({insumo.unidade})</Label>
            <CampoQuantidade
              id="compra-qtd"
              valor={quantidade}
              onChange={setQuantidade}
              unidade={insumo.unidade}
            />
            {insumo.unidade !== 'un' && (
              <Button
                type="button"
                variant={digitadoEmMil ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDigitadoEmMil((v) => !v)}
              >
                Digitei em {insumo.unidade === 'g' ? 'kg' : 'L'} (×1000)
              </Button>
            )}
            {digitadoEmMil && quantidadeBase !== null && (
              <p className="text-xs text-muted-foreground">
                = {quantidadeBase} {insumo.unidade}
              </p>
            )}
          </div>

          {custoNovo !== null && variacao !== null && (
            <p className="text-sm">
              {formatarDinheiro(custoAntigo)} →{' '}
              <strong className="tabular-nums">{formatarDinheiro(custoNovo)}</strong>/
              {insumo.unidade}{' '}
              <span
                className={
                  variacao > 0
                    ? 'inline-flex items-center gap-0.5 font-semibold text-custo'
                    : 'inline-flex items-center gap-0.5 font-semibold text-muted-foreground'
                }
              >
                {variacao > 0 && <ArrowUp className="size-3.5" aria-hidden />}
                {variacao < 0 && <ArrowDown className="size-3.5" aria-hidden />}
                {formatarPercentual(Math.abs(variacao))}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="h-12 md:h-9" onClick={limparEFechar}>
            Cancelar
          </Button>
          <Button type="button" className="h-12 md:h-9" onClick={salvar} disabled={registrar.isPending}>
            {registrar.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
