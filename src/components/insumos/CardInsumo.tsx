import { ShoppingCart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatarCustoLegivel } from '@/lib/insumos'
import { formatarDinheiro } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Insumo } from '@/lib/tipos'

function formatarFator(fator: number): string {
  return String(fator).replace('.', ',')
}

export default function CardInsumo({
  insumo,
  onEditar,
  onRegistrarCompra,
}: {
  insumo: Insumo
  onEditar: () => void
  onRegistrarCompra: () => void
}) {
  return (
    <Card className={cn(!insumo.ativo && 'opacity-60')}>
      <CardContent className="pt-4">
        <button type="button" onClick={onEditar} className="block w-full text-left">
          <p className="font-medium">
            {insumo.nome}
            {!insumo.ativo && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">arquivado</span>
            )}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-custo">
            {formatarCustoLegivel(insumo)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fator de rendimento {formatarFator(insumo.fator_rendimento)} · última compra{' '}
            {formatarDinheiro(insumo.preco_pago)} por {insumo.quantidade_comprada}
            {insumo.unidade}
          </p>
        </button>
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-11 gap-1.5 md:h-8"
          onClick={onRegistrarCompra}
          disabled={!insumo.ativo}
        >
          <ShoppingCart className="size-3.5" aria-hidden />
          Compra
        </Button>
      </CardContent>
    </Card>
  )
}
