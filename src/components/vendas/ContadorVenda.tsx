import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Contador +1/−1 grande (celular, mão apressada — alvo ≥48px). O número
 * central também aceita digitação direta com o teclado numérico.
 */
export default function ContadorVenda({
  quantidade,
  onAlterar,
  onDefinir,
}: {
  quantidade: number
  onAlterar: (delta: number) => void
  onDefinir: (valor: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        className="size-12 shrink-0 rounded-full p-0"
        onClick={() => onAlterar(-1)}
        disabled={quantidade <= 0}
        aria-label="Diminuir uma unidade"
      >
        <Minus className="size-5" aria-hidden />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={quantidade}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, '')
          onDefinir(digitos === '' ? 0 : Number(digitos))
        }}
        onFocus={(e) => e.target.select()}
        className="h-12 w-12 shrink-0 rounded-md border bg-card text-center text-base font-semibold tabular-nums"
        aria-label="Quantidade vendida"
      />
      <Button
        type="button"
        variant="outline"
        className="size-12 shrink-0 rounded-full p-0"
        onClick={() => onAlterar(1)}
        aria-label="Aumentar uma unidade"
      >
        <Plus className="size-5" aria-hidden />
      </Button>
    </div>
  )
}
