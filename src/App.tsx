import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MainProvider } from '@/stores/main'

import Layout from './components/Layout'
import Index from './pages/Index'
import Financeiro from './pages/Financeiro'
import CRM from './pages/CRM'
import Mentorias from './pages/Mentorias'
import Clientes from './pages/Clientes'
import Configuracoes from './pages/Configuracoes'
import Agendar from './pages/Agendar'
import NotFound from './pages/NotFound'

// Portal
import PortalLogin from './pages/portal/Login'
import PortalLayout from './pages/portal/PortalLayout'
import PortalDashboard from './pages/portal/Dashboard'

const App = () => (
  <MainProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/agendar" element={<Agendar />} />

          {/* Portal Routes */}
          <Route path="/portal" element={<Navigate to="/portal/login" replace />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route element={<PortalLayout />}>
            <Route path="/portal/dashboard" element={<PortalDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/mentorias" element={<Mentorias />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </MainProvider>
)

export default App
