import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useMainStore } from '@/stores/main'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Toaster } from '@/components/ui/toaster'
import { AlertTriangle } from 'lucide-react'
import { cloudApi } from '@/lib/cloudApi'

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
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function EnvGuard({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!cloudApi.isSupabaseConfigured()) {
      setShowWarning(true)
    }
  }, [])

  return (
    <>
      {showWarning && (
        <div className="bg-destructive text-destructive-foreground text-center p-2 text-xs font-medium flex items-center justify-center gap-2 z-50 relative shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Aviso: Banco de dados não configurado corretamente. Funcionalidades podem estar
            indisponíveis. Verifique o painel de variáveis de ambiente.
          </span>
        </div>
      )}
      {children}
    </>
  )
}

export default function App() {
  const menteeAuth = useMainStore((state) => state.menteeAuth)

  return (
    <EnvGuard>
      <AuthProvider>
        <BrowserRouter>
          <RouteTracker />
          <Routes>
            {/* Rota raiz redireciona para agendar garantindo fluxo direto para a visão do cliente */}
            <Route path="/" element={<Navigate to="/agendar" replace />} />

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
