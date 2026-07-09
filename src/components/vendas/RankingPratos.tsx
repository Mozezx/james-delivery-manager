import { TrendingUp, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import type { RankingPrato } from '@/lib/calculos'

/**
 * Mais vendido × mais lucrativo lado a lado (plano-07) — nem sempre o
 * mesmo prato; destaca quando divergem.
 */
export default function RankingPratos({
  maisVendido,
  maisLucrativo,
  nomePrato,
}: {
  maisVendido: RankingPrato | null
  maisLucrativo: RankingPrato | null
  nomePrato: (pratoId: string) => string
}) {
  if (!maisVendido || !maisLucrativo) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma venda lançada neste mês ainda.</p>
    )
  }

  const divergem = maisVendido.prato_id !== maisLucrativo.prato_id

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card>
        <CardContent className="py-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Trophy className="size-3.5" aria-hidden /> Mais vendido
          </p>
          <p className="mt-1 truncate font-semibold">{nomePrato(maisVendido.prato_id)}</p>
          <p className="mt-0.5 flex items-baseline gap-1.5 text-sm text-muted-foreground">
            {maisVendido.quantidade} marmitas ·{' '}
            <Dinheiro valor={maisVendido.lucro} tamanho="sm" tom="lucro" />
          </p>
        </CardContent>
      </Card>
      <Card className={divergem ? 'border-primary/40' : undefined}>
        <CardContent className="py-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="size-3.5" aria-hidden /> Mais lucrativo
          </p>
          <p className="mt-1 truncate font-semibold">{nomePrato(maisLucrativo.prato_id)}</p>
          <p className="mt-0.5 flex items-baseline gap-1.5 text-sm text-muted-foreground">
            {maisLucrativo.quantidade} marmitas ·{' '}
            <Dinheiro valor={maisLucrativo.lucro} tamanho="sm" tom="lucro" />
          </p>
          {divergem && (
            <p className="mt-1.5 text-xs font-medium text-primary">Diferente do mais vendido</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
