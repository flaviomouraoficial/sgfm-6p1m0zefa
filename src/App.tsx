import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, Suspense, lazy } from 'react'
import { Layout } from '@/components/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useMainStore } from '@/stores/main'
import { useFinanceStore } from '@/stores/finance'
import { AuthProvider, useAuth, checkIsAdmin } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const Login = lazy(() => import('@/pages/Login'))
const Index = lazy(() => import('@/pages/Index'))
const PublicAssessment = lazy(() => import('@/pages/PublicAssessment'))
const AssessmentAdmin = lazy(() => import('@/pages/AssessmentAdmin'))
const AssessmentReport = lazy(() => import('@/pages/AssessmentReport'))
const Agenda = lazy(() => import('@/pages/Agenda'))
const CRM = lazy(() => import('@/pages/CRM'))
const Clientes = lazy(() => import('@/pages/Clientes'))
const Financeiro = lazy(() => import('@/pages/Financeiro'))
const Biblioteca = lazy(() => import('@/pages/Biblioteca'))
const Propostas = lazy(() => import('@/pages/Propostas'))
const Relatorios = lazy(() => import('@/pages/Relatorios'))
const Usuarios = lazy(() => import('@/pages/Usuarios'))
const Recibos = lazy(() => import('@/pages/Recibos'))
const Configuracoes = lazy(() => import('@/pages/Configuracoes'))
const Prontuarios = lazy(() => import('@/pages/Prontuarios'))
const Agendar = lazy(() => import('@/pages/Agendar'))
const PortalAgenda = lazy(() => import('@/pages/portal/Agenda'))
const PortalLayout = lazy(() => import('@/pages/portal/PortalLayout'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const SaasDashboard = lazy(() => import('@/pages/admin/saas/SaasDashboard'))
const SaasSettings = lazy(() => import('@/pages/admin/saas/SaasSettings'))
const SaasResults = lazy(() => import('@/pages/admin/saas/SaasResults'))
const SaasLinks = lazy(() => import('@/pages/admin/saas/SaasLinks'))
const ClientDashboard = lazy(() => import('@/pages/saas/Dashboard'))
const ClientStore = lazy(() => import('@/pages/saas/Store'))
const ClientAssessmentFlow = lazy(() => import('@/pages/saas/AssessmentFlow'))
const ClientResults = lazy(() => import('@/pages/saas/Results'))
const ComprarCreditos = lazy(() => import('@/pages/saas/ComprarCreditos'))
const SaasCreditsAdmin = lazy(() => import('@/pages/admin/saas/SaasCreditsAdmin'))

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

function AuthGuard({
  children,
  requireAdmin = false,
  requireClient = false,
  requireMentee = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
  requireClient?: boolean
  requireMentee?: boolean
}) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const { toast } = useToast()
  const [toastFired, setToastFired] = useState(false)

  const isAdmin = user ? checkIsAdmin(user) : false
  const isClient = user?.role === 'client'
  const isMentee = user?.role === 'mentee' || (!!user && !isAdmin && !isClient)

  useEffect(() => {
    if (!loading && isAuthenticated && user && requireAdmin && !isAdmin && !toastFired) {
      toast({
        description: 'Acesso restrito: você não tem permissão para acessar esta área.',
        variant: 'destructive',
      })
      setToastFired(true)
    }
  }, [loading, isAuthenticated, user, requireAdmin, isAdmin, toastFired, toast])

  if (loading) return <FullPageLoader />

  if (!isAuthenticated || !user || !pb.authStore.isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={isClient ? '/dashboard' : '/portal/agenda'} replace />
  }

  if (requireClient && !isClient) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/portal/agenda'} replace />
  }

  if (requireMentee && !isMentee) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return <>{children}</>
}

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) return <FullPageLoader />

  if (!isAuthenticated || !user || !pb.authStore.isValid) {
    return <Navigate to="/login" replace />
  }

  const role = user.role || 'mentee'

  if (checkIsAdmin(user)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (role === 'client') {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/portal/agenda" replace />
}

function RouteTracker() {
  const location = useLocation()
  const setCurrentPath = useMainStore((state) => state.setCurrentPath)

  useEffect(() => {
    setCurrentPath(location.pathname)
  }, [location.pathname, setCurrentPath])

  return null
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
  const { fetchContas } = useFinanceStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const isAuthenticated = !!user
  const isAdmin = checkIsAdmin(user)

  useRealtime(
    'v1_transactions',
    (e) => {
      if (e.action === 'delete') {
        useMainStore.setState((s) => ({
          transactions: s.transactions.filter((t) => t.id !== e.record.id),
        }))
      } else {
        fetchTransactions()
      }
    },
    isAuthenticated && isAdmin,
  )

  useRealtime(
    'v1_contas_financeiras',
    () => {
      fetchContas()
    },
    isAuthenticated && isAdmin,
  )

  useRealtime(
    'v1_deals',
    (e) => {
      if (e.action === 'delete') {
        useMainStore.setState((s) => ({
          deals: s.deals.filter((d) => d.id !== e.record.id),
        }))
      } else {
        fetchDeals()
      }
    },
    isAuthenticated && isAdmin,
  )

  useRealtime(
    'v1_agendamentos',
    (e) => {
      if (e.action === 'delete') {
        useMainStore.setState((s) => ({
          agendamentos: s.agendamentos.filter((a) => a.id !== e.record.id),
        }))
      } else {
        fetchAgendamentos()
      }
      if (isAdmin && e.action === 'create') {
        toast({
          title: 'Novo Agendamento Recebido',
          description: `O cliente ${e.record.cliente_nome} acabou de agendar uma sessão.`,
        })
      }
    },
    isAuthenticated && isAdmin,
  )

  useRealtime(
    'v1_time_slots',
    (e) => {
      if (e.action === 'delete') {
        useMainStore.setState((s) => ({
          timeSlots: s.timeSlots.filter((t) => t.id !== e.record.id),
        }))
      } else {
        fetchTimeSlots()
      }
    },
    isAuthenticated,
  )

  useRealtime(
    'v1_sessoes',
    (e) => {
      if (e.action === 'delete') {
        useMainStore.setState((s) => ({
          clientSessions: s.clientSessions.filter((sess) => sess.id !== e.record.id),
          mentees: s.mentees.map((m) => ({
            ...m,
            sessions: (m.sessions || []).filter((sess) => sess.id !== e.record.id),
          })),
          clients: s.clients.map((c) => ({
            ...c,
            sessions: (c.sessions || []).filter((sess) => sess.id !== e.record.id),
          })),
        }))
      } else {
        fetchMenteesAndClients()
      }
    },
    isAuthenticated,
  )

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

              <Route path="/assessment/:slug" element={<PublicAssessment />} />

              <Route path="/portal/login" element={<Navigate to="/login" replace />} />

              <Route
                path="/portal"
                element={
                  <AuthGuard requireMentee>
                    <PortalLayout />
                  </AuthGuard>
                }
              >
                <Route index element={<Navigate to="agenda" replace />} />
                <Route path="agenda" element={<PortalAgenda />} />
              </Route>

              {/* Rotas administrativas protegidas */}
              <Route
                path="/admin"
                element={
                  <AuthGuard requireAdmin>
                    <Layout />
                  </AuthGuard>
                }
              >
                <Route index element={<Index />} />
                <Route path="dashboard" element={<SaasDashboard />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="funil" element={<CRM />} />
                <Route path="propostas" element={<Propostas />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="biblioteca" element={<Biblioteca />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="prontuarios" element={<Prontuarios />} />
                <Route path="recibos" element={<Recibos />} />
                <Route path="assessments" element={<AssessmentAdmin />} />
                <Route path="assessments/report/:id" element={<AssessmentReport />} />
                <Route path="painel" element={<Usuarios />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="saas/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="saas/packages" element={<SaasSettings />} />
                <Route path="saas/settings" element={<SaasSettings />} />
                <Route path="saas/results" element={<SaasResults />} />
                <Route path="saas/links" element={<SaasLinks />} />
                <Route path="saas/credits" element={<SaasCreditsAdmin />} />
              </Route>

              <Route
                path="/dashboard"
                element={
                  <AuthGuard requireClient>
                    <Layout />
                  </AuthGuard>
                }
              >
                <Route index element={<ClientDashboard />} />
                <Route path="store" element={<Navigate to="/saas/credits" replace />} />
                <Route path="assessment/:id" element={<ClientAssessmentFlow />} />
                <Route path="results" element={<ClientResults />} />
              </Route>

              <Route
                path="/saas/credits"
                element={
                  <AuthGuard requireClient>
                    <Layout />
                  </AuthGuard>
                }
              >
                <Route index element={<ClientStore />} />
              </Route>

              <Route path="/comprar-creditos" element={<Navigate to="/saas/credits" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </EnvGuard>
  )
}
