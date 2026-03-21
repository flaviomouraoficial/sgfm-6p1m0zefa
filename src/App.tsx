import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useAuthStore } from '@/stores/main'
import { Toaster } from '@/components/ui/toaster'

import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Clientes from '@/pages/Clientes'
import CRM from '@/pages/CRM'
import Financeiro from '@/pages/Financeiro'

function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Index />} />
            <Route path="mentorados" element={<Clientes />} />
            <Route path="funil" element={<CRM />} />
            <Route path="financeiro" element={<Financeiro />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
