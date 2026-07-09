import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'

export type CanalRealizado = {
  nome: string
  quantidade: number
  receita: number
  lucro: number
}

/**
 * Comparativo por canal REALIZADO (vendas do mês): mesma linguagem visual
 * do <ComparacaoCanais> (que compara preço sugerido) só que com volume,
 * faturamento e lucro efetivamente lançados — plano-07.
 */
export default function ComparativoCanalRealizado({ canais }: { canais: CanalRealizado[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {canais.map((canal) => (
        <Card key={canal.nome}>
          <CardContent className="py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {canal.nome}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums leading-none">
              {canal.quantidade}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">marmitas vendidas</p>

            <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Faturamento</dt>
                <dd>
                  <Dinheiro valor={canal.receita} tamanho="sm" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Lucro estimado</dt>
                <dd>
                  <Dinheiro
                    valor={canal.lucro}
                    tamanho="md"
                    tom={canal.lucro >= 0 ? 'lucro' : 'negativo'}
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
