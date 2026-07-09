import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Input de dinheiro pt-BR: prefixo R$, teclado numérico no celular,
 * aceita vírgula. O valor vive como texto no estado do pai — converta
 * com lerDecimal() na hora de salvar/calcular.
 */
export default function CampoDinheiro({
  id,
  valor,
  onChange,
  className,
}: {
  id?: string
  valor: string
  onChange: (texto: string) => void
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 pl-10 text-base tabular-nums md:h-9 md:text-sm"
      />
    </div>
  )
}
