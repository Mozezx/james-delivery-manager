import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { CookingPot } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Login() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (session) {
    return <Navigate to="/" replace />
  }

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setEnviando(false)
    }
    // Com sucesso, o AuthProvider recebe a sessão e o <Navigate> acima redireciona.
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4">
      {/* Atmosfera: calor de cozinha sobre o creme, sem virar pôster */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(560px 420px at 85% -10%, rgba(196,85,45,0.14), transparent 70%), radial-gradient(480px 380px at -10% 105%, rgba(180,83,9,0.10), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <CookingPot className="size-8 text-primary-foreground" aria-hidden />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            James
          </h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Delivery Manager
          </p>
        </header>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>
              Acesso restrito ao dono do negócio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={entrar} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-12"
                />
              </div>

              {erro && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {erro}
                </p>
              )}

              <Button
                type="submit"
                disabled={enviando}
                className="h-12 w-full text-base font-semibold"
              >
                {enviando ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Custos e preços das marmitas, sem planilha.
        </p>
      </div>
    </main>
  )
}
