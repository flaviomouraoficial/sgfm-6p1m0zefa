import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useAuthStore, useMainStore } from '@/stores/main'
import { Toaster } from '@/components/ui/toaster'

import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Mentorias from '@/pages/Mentorias'
import Agenda from '@/pages/Agenda'
import CRM from '@/pages/CRM'
import Clientes from '@/pages/Clientes'
import Financeiro from '@/pages/Financeiro'
import Propostas from '@/pages/Propostas'
import Relatorios from '@/pages/Relatorios'
import Configuracoes from '@/pages/Configuracoes'
import Agendar from '@/pages/Agendar'
import PortalLogin from '@/pages/portal/Login'
import PortalDashboard from '@/pages/portal/Dashboard'

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const _hasHydrated = useAuthStore((state) => state._hasHydrated)
  const menteeAuth = useMainStore((state) => state.menteeAuth)

  if (!_hasHydrated) {
    return null
  }

  return (
    <>
      <style>{`
        :root {
          --primary: 172 59% 38%; /* #279989 */
          --secondary: 169 65% 30%; /* #1B806D */
          --accent: 196 43% 25%; /* #244C5A */
        }
      `}</style>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />

          <Route path="/agendar" element={<Agendar />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route
            path="/portal/dashboard"
            element={
              menteeAuth?.isAuthenticated ? (
                <PortalDashboard />
              ) : (
                <Navigate to="/portal/login" replace />
              )
            }
          />

          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Index />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="mentorados" element={<Mentorias />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="funil" element={<CRM />} />
            <Route path="propostas" element={<Propostas />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
