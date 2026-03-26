import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuthStore, useMainStore } from '@/stores/main'
import { Toaster } from '@/components/ui/toaster'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Database } from 'lucide-react'
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function EnvGuard({ children }: { children: React.ReactNode }) {
  if (!cloudApi.isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="max-w-lg w-full text-center shadow-2xl border-destructive/20 bg-card">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-foreground">
              Configuração do Banco de Dados Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="text-left">
            <p className="text-sm text-muted-foreground mb-4">
              As variáveis de ambiente do Supabase não foram detectadas no sistema. Para garantir o
              funcionamento completo e a camada de conexão do sistema de agendamento, crie um
              arquivo .env na raiz do projeto contendo as seguintes chaves de integração:
            </p>
            <div className="bg-foreground/5 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-border/50 text-foreground whitespace-pre mb-4">
              {`VITE_SUPABASE_URL="https://sua-url-do-supabase.co"\nVITE_SUPABASE_ANON_KEY="sua-anon-key-do-supabase"`}
            </div>
            <p className="text-sm text-muted-foreground">
              Após configurar, a aplicação identificará automaticamente as credenciais e recarregará
              a interface de conexão.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
    <EnvGuard>
      <BrowserRouter>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<Navigate to="/agendar" replace />} />
          <Route path="/agendar" element={<Agendar />} />
          <Route path="/login" element={<Login />} />
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
      <Toaster />
    </EnvGuard>
  )
}
