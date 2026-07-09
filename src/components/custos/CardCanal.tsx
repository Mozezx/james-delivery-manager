import { Card, CardContent } from '@/components/ui/card'
import Percentual from '@/components/Percentual'
import { formatarDinheiro } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Canal } from '@/lib/tipos'

export default function CardCanal({
  canal,
  onEditar,
}: {
  canal: Canal
  onEditar: () => void
}) {
  const totalPct = canal.comissao_pct + canal.taxa_pagamento_pct
  const totalReais = formatarDinheiro((100 * totalPct) / 100)

  return (
    <Card className={cn(!canal.ativo && 'opacity-60')}>
      <CardContent className="pt-4">
        <button type="button" onClick={onEditar} className="block w-full text-left">
          <p className="font-medium">
            {canal.nome}
            {!canal.ativo && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">arquivado</span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              Comissão <Percentual fracao={canal.comissao_pct / 100} tom="custo" />
            </span>
            <span className="text-muted-foreground">
              Taxa de pagamento <Percentual fracao={canal.taxa_pagamento_pct / 100} tom="custo" />
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            De cada R$ 100 vendidos, {totalReais} vão de comissão e taxas.
          </p>
        </button>
      </CardContent>
    </Card>
  )
}
