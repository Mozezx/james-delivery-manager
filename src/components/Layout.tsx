import { NavLink, Outlet } from 'react-router-dom'
import {
  Carrot,
  ChartColumn,
  CookingPot,
  LogOut,
  Tags,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const telas = [
  { rota: '/insumos', nome: 'Insumos', Icone: Carrot },
  { rota: '/pratos', nome: 'Pratos', Icone: UtensilsCrossed },
  { rota: '/custos', nome: 'Custos', Icone: Wallet },
  { rota: '/precos', nome: 'Preços', Icone: Tags },
  { rota: '/vendas', nome: 'Vendas', Icone: ChartColumn },
]

export default function Layout() {
  async function sair() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <CookingPot className="size-4.5 text-primary-foreground" aria-hidden />
            </div>
            <span className="font-heading font-bold tracking-tight">James</span>
          </div>

          {/* Navegação horizontal — só no desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {telas.map(({ rota, nome }) => (
              <NavLink
                key={rota}
                to={rota}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )
                }
              >
                {nome}
              </NavLink>
            ))}
          </nav>

          <Button variant="ghost" size="sm" onClick={sair} className="gap-2">
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:pb-10">
        <Outlet />
      </main>

      {/* Navegação inferior — celular (mão molhada, pressa: alvos grandes) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {telas.map(({ rota, nome, Icone }) => (
            <NavLink
              key={rota}
              to={rota}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <Icone className="size-5" aria-hidden />
              {nome}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
