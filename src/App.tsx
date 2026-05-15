import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, Suspense, lazy } from 'react'
import { Layout } from '@/components/Layout'
import { useMainStore } from '@/stores/main'
import { AuthProvider, useAuth, checkIsAdmin } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Toaster } from '@/components/ui/toaster'

const Login = lazy(() => import('@/pages/Login'))
const Index = lazy(() => import('@/pages/Index'))
const Mentorias = lazy(() => import('@/pages/Mentorias'))
const Agenda = lazy(() => import('@/pages/Agenda'))
const CRM = lazy(() => import('@/pages/CRM'))
const Clientes = lazy(() => import('@/pages/Clientes'))
const Financeiro = lazy(() => import('@/pages/Financeiro'))
const Propostas = lazy(() => import('@/pages/Propostas'))
const Relatorios = lazy(() => import('@/pages/Relatorios'))
const Usuarios = lazy(() => import('@/pages/Usuarios'))
const Configuracoes = lazy(() => import('@/pages/Configuracoes'))
const Agendar = lazy(() => import('@/pages/Agendar'))
const PortalDashboard = lazy(() => import('@/pages/portal/Dashboard'))
const PortalLayout = lazy(() => import('@/pages/portal/PortalLayout'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export function FullPageLoader() {
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
          <h2 className="text-lg font-bold text-foreground">Aguarde um momento...</h2>
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
      <Navigate to="/portal/dashboard" replace />
    )
  }
  return <Navigate to="/login" replace />
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
    return <Navigate to="/portal/dashboard" replace />
  }

  return <>{children}</>
}

function MenteeGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (checkIsAdmin(user)) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function EnvGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function GlobalSubscriptions() {
  const {
    fetchTransactions,
    fetchDeals,
    fetchAgendamentos,
    fetchTimeSlots,
    fetchMenteesAndClients,
  } = useMainStore()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const isAdmin = checkIsAdmin(user)

  useRealtime('v1_transactions', () => fetchTransactions(), isAuthenticated && isAdmin)
  useRealtime('v1_deals', () => fetchDeals(), isAuthenticated && isAdmin)
  useRealtime('v1_agendamentos', () => fetchAgendamentos(), isAuthenticated && isAdmin)
  useRealtime('v1_time_slots', () => fetchTimeSlots(), isAuthenticated)
  useRealtime('v1_sessoes', () => fetchMenteesAndClients(), isAuthenticated)

  return null
}

export default function App() {
  return (
    <EnvGuard>
      <AuthProvider>
        <BrowserRouter>
          <RouteTracker />
          <GlobalSubscriptions />
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              <Route path="/login" element={<Login />} />

              {/* Agendamento público para clientes */}
              <Route path="/agendar" element={<Agendar />} />

              <Route path="/portal/login" element={<Navigate to="/login" replace />} />

              <Route
                path="/portal"
                element={
                  <MenteeGuard>
                    <PortalLayout />
                  </MenteeGuard>
                }
              >
                <Route path="dashboard" element={<PortalDashboard />} />
              </Route>

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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </EnvGuard>
  )
}
