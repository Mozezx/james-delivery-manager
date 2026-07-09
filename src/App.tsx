import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import RotaProtegida from '@/components/RotaProtegida'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Inicio from '@/pages/Inicio'
import Estilo from '@/pages/Estilo'
import Insumos from '@/pages/Insumos'
import EmConstrucao from '@/pages/EmConstrucao'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RotaProtegida>
                <Layout />
              </RotaProtegida>
            }
          >
            <Route index element={<Inicio />} />
            <Route path="estilo" element={<Estilo />} />
            <Route path="insumos" element={<Insumos />} />
            <Route
              path="pratos"
              element={<EmConstrucao titulo="Pratos" fase="Fase 4" />}
            />
            <Route
              path="custos"
              element={<EmConstrucao titulo="Custos fixos" fase="Fase 5" />}
            />
            <Route
              path="precos"
              element={<EmConstrucao titulo="Preços" fase="Fase 6" />}
            />
            <Route
              path="vendas"
              element={<EmConstrucao titulo="Vendas" fase="Fase 7" />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}
