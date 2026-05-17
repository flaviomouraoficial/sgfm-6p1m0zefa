import { Outlet, useNavigate } from 'react-router-dom'
import { Suspense } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando módulo...</p>
      </div>
    </div>
  )
}

export default function PortalLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="h-16 border-b bg-card shadow-sm flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Portal do Mentorado</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Flávio Moura Mentoria</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/agendar')}
            className="hidden sm:flex shadow-sm hover:shadow-md transition-shadow"
          >
            Agendar Sessão
          </Button>
          <span className="text-sm font-medium hidden sm:inline-block">
            Olá, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Mentorado'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline-block">Sair</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-muted/10">
        <div className="max-w-6xl mx-auto w-full">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
