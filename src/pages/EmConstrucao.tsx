import { Card, CardContent } from '@/components/ui/card'

export default function EmConstrucao({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <section>
      <h1 className="font-heading text-2xl font-bold tracking-tight">{titulo}</h1>
      <Card className="mt-4 border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Esta tela chega na {fase}.
        </CardContent>
      </Card>
    </section>
  )
}
