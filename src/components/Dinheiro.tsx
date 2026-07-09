import { formatarDinheiro } from '@/lib/formato'
import { cn } from '@/lib/utils'

type Tom = 'neutro' | 'lucro' | 'custo' | 'negativo'
type Tamanho = 'sm' | 'md' | 'lg' | 'xl'

const tons: Record<Tom, string> = {
  neutro: 'text-foreground',
  lucro: 'text-lucro',
  custo: 'text-custo',
  negativo: 'text-destructive',
}

/* Verde #1E8E5A sobre creme só passa contraste AA em texto grande/semibold —
   por isso lucro/custo ganham peso extra nos tamanhos pequenos. */
const tamanhos: Record<Tamanho, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-semibold',
  xl: 'text-3xl font-bold',
}

export default function Dinheiro({
  valor,
  tamanho = 'md',
  tom = 'neutro',
  className,
}: {
  valor: number
  tamanho?: Tamanho
  tom?: Tom
  className?: string
}) {
  return (
    <span className={cn('tabular-nums', tamanhos[tamanho], tons[tom], className)}>
      {formatarDinheiro(valor)}
    </span>
  )
}
