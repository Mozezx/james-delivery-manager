import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Dinheiro from '@/components/Dinheiro'
import Percentual from '@/components/Percentual'
import CampoDinheiro from '@/components/CampoDinheiro'
import CampoQuantidade from '@/components/CampoQuantidade'
import ComparacaoCanais from '@/components/ComparacaoCanais'
import { lerDecimal } from '@/lib/formato'

const cores = [
  { nome: 'primary (terracota)', classe: 'bg-primary', hex: '#C4552D' },
  { nome: 'background (creme)', classe: 'bg-background border', hex: '#FAF6F0' },
  { nome: 'foreground', classe: 'bg-foreground', hex: '#2A1F1A' },
  { nome: 'lucro (exclusivo)', classe: 'bg-lucro', hex: '#1E8E5A' },
  { nome: 'custo / alerta', classe: 'bg-custo', hex: '#B45309' },
  { nome: 'destructive (erro)', classe: 'bg-destructive', hex: '#B3261E' },
]

// Números do exemplo de referência do CLAUDE.md (Marmita Padrão)
const canaisExemplo = [
  {
    nome: 'Venda direta',
    precoSugerido: 19.25,
    comissao: 0,
    lucro: 5.78,
    margemEfetiva: 0.3,
    destaque: true,
  },
  {
    nome: 'iFood',
    precoSugerido: 29.93,
    comissao: 7.48,
    lucro: 8.98,
    margemEfetiva: 0.3,
  },
]

export default function Estilo() {
  const [dinheiro, setDinheiro] = useState('35,50')
  const [quantidade, setQuantidade] = useState('150')

  const dinheiroLido = lerDecimal(dinheiro)
  const quantidadeLida = lerDecimal(quantidade)

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Guia de estilo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rota interna (/estilo) — prova o design system antes das telas de
          negócio.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Paleta</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cores.map((cor) => (
            <div key={cor.nome} className="space-y-1.5">
              <div className={`h-14 rounded-lg ${cor.classe}`} />
              <p className="text-xs font-medium">{cor.nome}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{cor.hex}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Verde é exclusivo de lucro — nunca em botões ou marca. Verde sobre
          creme passa AA apenas em texto grande/semibold; os componentes já
          aplicam o peso certo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dinheiro e percentual</h2>
        <Card>
          <CardContent className="flex flex-wrap items-end gap-x-8 gap-y-3 pt-5">
            <Dinheiro valor={19.25} tamanho="xl" />
            <Dinheiro valor={8.34} tamanho="lg" tom="custo" />
            <Dinheiro valor={5.78} tamanho="md" tom="lucro" />
            <Dinheiro valor={-2.5} tamanho="md" tom="negativo" />
            <Percentual fracao={0.3} tom="lucro" />
            <Percentual fracao={-0.05} tom="negativo" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Botões</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Salvar insumo</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Excluir</Button>
          <Button onClick={() => toast.success('Insumo salvo!')}>
            Testar toast
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Campos numéricos pt-BR</h2>
        <Card>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ex-dinheiro">Preço pago (aceita vírgula)</Label>
              <CampoDinheiro id="ex-dinheiro" valor={dinheiro} onChange={setDinheiro} />
              <p className="text-xs text-muted-foreground">
                Lido como:{' '}
                {dinheiroLido !== null ? (
                  <Dinheiro valor={dinheiroLido} tamanho="sm" />
                ) : (
                  <span className="text-destructive">número inválido</span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-qtd">Quantidade pronta</Label>
              <CampoQuantidade
                id="ex-qtd"
                valor={quantidade}
                onChange={setQuantidade}
                unidade="g"
              />
              <p className="text-xs text-muted-foreground">
                Lido como:{' '}
                {quantidadeLida !== null ? (
                  <span className="font-semibold tabular-nums">{quantidadeLida} g</span>
                ) : (
                  <span className="text-destructive">número inválido</span>
                )}
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ex-texto">Input de texto comum</Label>
              <Input id="ex-texto" placeholder="Arroz branco" className="h-12 md:h-9" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tabela com dinheiro</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marmita Padrão — ficha de exemplo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-right">Qtd. pronta</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Arroz (fator 2.2)</TableCell>
                  <TableCell className="text-right tabular-nums">150 g</TableCell>
                  <TableCell className="text-right"><Dinheiro valor={0.34} tamanho="sm" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Alcatra (fator 0.7)</TableCell>
                  <TableCell className="text-right tabular-nums">150 g</TableCell>
                  <TableCell className="text-right"><Dinheiro valor={7.5} tamanho="sm" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Embalagem térmica</TableCell>
                  <TableCell className="text-right tabular-nums">1 un</TableCell>
                  <TableCell className="text-right"><Dinheiro valor={0.5} tamanho="sm" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Custo direto</TableCell>
                  <TableCell />
                  <TableCell className="text-right"><Dinheiro valor={8.34} tom="custo" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comparação por canal</h2>
        <ComparacaoCanais canais={canaisExemplo} />
        <p className="text-xs text-muted-foreground">
          Números do exemplo de referência: custo total R$ 13,47, margem alvo 30%.
        </p>
      </section>
    </div>
  )
}
