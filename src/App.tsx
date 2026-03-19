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
import NotFound from './pages/NotFound'

const App = () => (
  <MainProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/mentorias" element={<Mentorias />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route
              path="/configuracoes"
              element={<div className="p-6">Configurações (Em breve)</div>}
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </MainProvider>
)

export default App
