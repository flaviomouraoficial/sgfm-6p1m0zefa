import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useMainStore } from '@/stores/main'
import { AuthProvider, useAuth, checkIsAdmin } from '@/hooks/use-auth'
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
import Usuarios from '@/pages/Usuarios'
import Configuracoes from '@/pages/Configuracoes'
import Agendar from '@/pages/Agendar'
import PortalLogin from '@/pages/portal/Login'
import PortalDashboard from '@/pages/portal/Dashboard'
import NotFound from '@/pages/NotFound'

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-accent">Verificando sessão...</h2>
        </div>
      </div>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />

  if (user) {
    return checkIsAdmin(user) ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/agendar" replace />
    )
  }
  return <Navigate to="/agendar" replace />
}

function RouteTracker() {
  const location = useLocation()
  const setCurrentPath = useMainStore((state) => state.setCurrentPath)

  useEffect(() => {
    setCurrentPath(location.pathname)
  }, [location.pathname, setCurrentPath])

  return null
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!checkIsAdmin(user)) {
    return <Navigate to="/agendar" replace />
  }

  return <>{children}</>
}

function EnvGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export default function App() {
  const menteeAuth = useMainStore((state) => state.menteeAuth)

  return (
    <EnvGuard>
      <AuthProvider>
        <BrowserRouter>
          <RouteTracker />
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route path="/login" element={<Login />} />

            {/* Agendamento público para clientes */}
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

            {/* Rotas administrativas protegidas */}
            <Route
              path="/admin"
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
              <Route path="painel" element={<Usuarios />} />
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </EnvGuard>
  )
}
