import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Banner "usar ritmo real" (plano-05/plano-07): aparece quando o ritmo
 * mensalizado de vendas diverge >20% da estimativa usada no rateio de
 * custos fixos. O botão grava o ritmo real como nova estimativa da config.
 */
export default function BannerRitmoReal({
  ritmoRealDia,
  onUsarRitmoReal,
  salvando,
}: {
  ritmoRealDia: number
  onUsarRitmoReal: () => void
  salvando: boolean
}) {
  return (
    <Card className="border-custo/40 bg-custo/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="flex items-start gap-2 text-sm text-custo">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            O ritmo real de vendas está bem diferente da estimativa usada no rateio (~
            {ritmoRealDia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}/dia).
          </span>
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-9 shrink-0"
          onClick={onUsarRitmoReal}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : 'Usar ritmo real'}
        </Button>
      </CardContent>
    </Card>
  )
}
