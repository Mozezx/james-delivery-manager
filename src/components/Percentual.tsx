import { formatarPercentual } from '@/lib/formato'
import { cn } from '@/lib/utils'

type Tom = 'neutro' | 'lucro' | 'custo' | 'negativo'

const tons: Record<Tom, string> = {
  neutro: 'text-foreground',
  lucro: 'text-lucro',
  custo: 'text-custo',
  negativo: 'text-destructive',
}

/** Exibe fração (0.3) como "30,0%" */
export default function Percentual({
  fracao,
  tom = 'neutro',
  className,
}: {
  fracao: number
  tom?: Tom
  className?: string
}) {
  return (
    <span className={cn('font-semibold tabular-nums', tons[tom], className)}>
      {formatarPercentual(fracao)}
    </span>
  )
}
