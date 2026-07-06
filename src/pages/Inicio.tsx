import { Card, CardContent } from '@/components/ui/card'

export default function Inicio() {
  return (
    <section>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Tudo pronto por aqui.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A fundação do app está no ar. As telas de trabalho chegam nas próximas
        fases — comece pelos insumos quando a Fase 3 for entregue.
      </p>
      <Card className="mt-4 border-dashed">
        <CardContent className="py-8 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Ordem de chegada:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Insumos (Fase 3)</li>
            <li>Pratos — fichas técnicas (Fase 4)</li>
            <li>Custos fixos e canais (Fase 5)</li>
            <li>Preços por canal (Fase 6)</li>
            <li>Vendas e visão do mês (Fase 7)</li>
          </ol>
        </CardContent>
      </Card>
    </section>
  )
}
