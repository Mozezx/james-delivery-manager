import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Input de quantidade com sufixo de unidade (g, ml, un, %...).
 * Mesmo contrato do CampoDinheiro: texto no pai, lerDecimal() ao usar.
 */
export default function CampoQuantidade({
  id,
  valor,
  onChange,
  unidade,
  className,
}: {
  id?: string
  valor: string
  onChange: (texto: string) => void
  unidade: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 pr-12 text-base tabular-nums md:h-9 md:text-sm"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
        {unidade}
      </span>
    </div>
  )
}
