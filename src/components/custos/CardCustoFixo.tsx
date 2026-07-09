import { Card, CardContent } from '@/components/ui/card'
import Dinheiro from '@/components/Dinheiro'
import { cn } from '@/lib/utils'
import type { CustoFixo } from '@/lib/tipos'

export default function CardCustoFixo({
  custoFixo,
  onEditar,
}: {
  custoFixo: CustoFixo
  onEditar: () => void
}) {
  return (
    <Card className={cn(!custoFixo.ativo && 'opacity-60')}>
      <CardContent className="pt-4">
        <button type="button" onClick={onEditar} className="flex w-full items-center justify-between gap-3 text-left">
          <p className="font-medium">
            {custoFixo.nome}
            {!custoFixo.ativo && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">arquivado</span>
            )}
          </p>
          <Dinheiro valor={custoFixo.valor_mensal} tamanho="md" tom="custo" />
        </button>
      </CardContent>
    </Card>
  )
}
