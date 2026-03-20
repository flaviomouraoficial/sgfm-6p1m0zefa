import { useEffect } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
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
import AdminLogin from './pages/Login'

// Portal
import PortalLogin from './pages/portal/Login'
import PortalLayout from './pages/portal/PortalLayout'
import PortalDashboard from './pages/portal/Dashboard'

const RootComponent = () => {
  const location = useLocation()

  useEffect(() => {
    // Force cache validation and sync on route change
    window.dispatchEvent(new Event('sgfm_cloud_sync_event'))
    window.scrollTo(0, 0)

    // Clear stale service workers to prevent mobile routing issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update()
        })
      })
    }
  }, [location.pathname])

  return <Outlet />
}

const router = createBrowserRouter([
  {
    element: <RootComponent />,
    children: [
      { path: '/agendar', element: <Agendar /> },
      { path: '/login', element: <AdminLogin /> },
      { path: '/portal', element: <Navigate to="/portal/login" replace /> },
      { path: '/portal/login', element: <PortalLogin /> },
      {
        element: <PortalLayout />,
        children: [{ path: '/portal/dashboard', element: <PortalDashboard /> }],
      },
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Index /> },
          { path: '/financeiro', element: <Financeiro /> },
          { path: '/crm', element: <CRM /> },
          { path: '/mentorias', element: <Mentorias /> },
          { path: '/clientes', element: <Clientes /> },
          { path: '/configuracoes', element: <Configuracoes /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

const App = () => (
  <MainProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </MainProvider>
)

export default App
