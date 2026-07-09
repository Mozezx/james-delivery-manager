import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import Percentual from '@/components/Percentual'
import { cn } from '@/lib/utils'

export type CanalComparado = {
  nome: string
  precoSugerido: number
  comissao: number // R$ descontados pelo canal (0 na venda direta)
  lucro: number
  margemEfetiva: number // fração: 0.3 = 30%
  destaque?: boolean // canal preferido (borda terracota)
}

/**
 * A vitrine do app: dois (ou mais) canais lado a lado no PC,
 * empilhados no celular. Preço e lucro legíveis em 2 segundos.
 */
export default function ComparacaoCanais({ canais }: { canais: CanalComparado[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {canais.map((canal) => (
        <Card
          key={canal.nome}
          className={cn(
            'relative overflow-hidden',
            canal.destaque && 'border-primary/50 shadow-md shadow-primary/10'
          )}
        >
          {canal.destaque && (
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden />
          )}
          <CardContent className="pt-5">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {canal.nome}
            </p>

            <p className="mt-1 leading-none">
              <Dinheiro valor={canal.precoSugerido} tamanho="xl" />
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">preço sugerido</p>

            <dl className="mt-4 space-y-1.5 border-t pt-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Comissões do canal</dt>
                <dd>
                  {canal.comissao > 0 ? (
                    <Dinheiro valor={-canal.comissao} tamanho="sm" tom="custo" />
                  ) : (
                    <span className="font-medium text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Lucro por marmita</dt>
                <dd>
                  <Dinheiro
                    valor={canal.lucro}
                    tamanho="md"
                    tom={canal.lucro >= 0 ? 'lucro' : 'negativo'}
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Margem efetiva</dt>
                <dd>
                  <Percentual
                    fracao={canal.margemEfetiva}
                    tom={canal.margemEfetiva >= 0 ? 'lucro' : 'negativo'}
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
