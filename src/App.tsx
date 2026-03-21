import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { useAuthStore } from '@/stores/main'
import { Toaster } from '@/components/ui/toaster'

import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Mentorias from '@/pages/Mentorias'
import Agenda from '@/pages/Agenda'
import CRM from '@/pages/CRM'
import Financeiro from '@/pages/Financeiro'

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Automatically redirect away from login if authenticated */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          {/* Protect routes and require authentication */}
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Index />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="mentorados" element={<Mentorias />} />
            <Route path="funil" element={<CRM />} />
            <Route path="financeiro" element={<Financeiro />} />
          </Route>
          {/* Catch-all route to prevent blank pages or trapping */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}
