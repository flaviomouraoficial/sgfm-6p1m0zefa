import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
import NotFound from '@/pages/NotFound'

function RouteTracker() {
  const location = useLocation()
  const setCurrentPath = useMainStore((state) => state.setCurrentPath)

  useEffect(() => {
    setCurrentPath(location.pathname)
  }, [location.pathname, setCurrentPath])

  return null
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  // Explicitly bypass authentication checks for public routes to ensure they are never blocked
  const publicRoutes = ['/agendar', '/login', '/portal/login']
  if (publicRoutes.includes(location.pathname)) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  const menteeAuth = useMainStore((state) => state.menteeAuth)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    setHydrated(useAuthStore.persist.hasHydrated())
    return () => unsub()
  }, [])

  if (!hydrated) {
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
        <RouteTracker />
        <Routes>
          {/* Public Routes - Explicitly top-level, decoupled from Layout and Auth */}
          <Route path="/agendar" element={<Agendar />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />

          {/* Portal Routes */}
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

          {/* Protected Administrative Routes with Layout */}
          <Route
            path="/"
            element={
              <AdminGuard>
                <Layout />
              </AdminGuard>
            }
          >
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

          {/* Catch-all - Handles undefined paths cleanly without forcing login */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
