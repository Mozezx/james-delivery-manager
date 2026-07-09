import { useState } from 'react'
import { Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CampoQuantidade from '@/components/CampoQuantidade'
import { lerDecimal } from '@/lib/formato'
import { calcularFatorRendimento } from '@/lib/calculos'

const PRESETS = [
  { nome: 'Não cozinha', valor: 1 },
  { nome: 'Arroz', valor: 2.2 },
  { nome: 'Feijão', valor: 2.5 },
  { nome: 'Massa', valor: 2 },
  { nome: 'Carne grelhada', valor: 0.7 },
  { nome: 'Frango cozido', valor: 0.75 },
  { nome: 'Fritura', valor: 0.85 },
]

function formatarNumero(numero: number): string {
  return String(Math.round(numero * 1000) / 1000).replace('.', ',')
}

/**
 * Três caminhos para o mesmo campo (plano-03): presets em chips, ajuste
 * livre no input, e medição assistida (dialog "pesei cru / rendeu pronto").
 * O valor do fator vive como texto no componente pai — mesmo contrato do
 * CampoDinheiro/CampoQuantidade.
 */
export default function CampoFatorRendimento({
  valor,
  onChange,
}: {
  valor: string
  onChange: (texto: string) => void
}) {
  const [medirAberto, setMedirAberto] = useState(false)
  const [cru, setCru] = useState('')
  const [pronto, setPronto] = useState('')

  const fatorLido = lerDecimal(valor)

  function aplicarMedicao() {
    const cruLido = lerDecimal(cru)
    const prontoLido = lerDecimal(pronto)
    if (cruLido === null || prontoLido === null || cruLido <= 0) return
    onChange(formatarNumero(calcularFatorRendimento(cruLido, prontoLido)))
    setMedirAberto(false)
    setCru('')
    setPronto('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset.nome}
            type="button"
            size="sm"
            variant={fatorLido === preset.valor ? 'default' : 'outline'}
            onClick={() => onChange(formatarNumero(preset.valor))}
          >
            {preset.nome} {formatarNumero(preset.valor)}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="1,0"
          className="h-12 w-24 tabular-nums md:h-9"
        />
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto gap-1 px-0"
          onClick={() => setMedirAberto(true)}
        >
          <Ruler className="size-3.5" aria-hidden />
          medir o meu
        </Button>
      </div>

      {fatorLido !== null && fatorLido > 0 && (
        <p className="text-xs text-muted-foreground">
          100g cru vira {formatarNumero(fatorLido * 100)}g pronto
        </p>
      )}

      <Dialog open={medirAberto} onOpenChange={setMedirAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Medir o rendimento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="medir-cru">Pesei cru</Label>
              <CampoQuantidade id="medir-cru" valor={cru} onChange={setCru} unidade="g" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medir-pronto">Rendeu pronto</Label>
              <CampoQuantidade id="medir-pronto" valor={pronto} onChange={setPronto} unidade="g" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={aplicarMedicao}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
