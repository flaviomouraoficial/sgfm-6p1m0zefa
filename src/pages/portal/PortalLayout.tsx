import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useMainStore } from '@/stores/main'
import { LogOut, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PortalLayout() {
  const { menteeAuth, mentees, logoutMentee } = useMainStore()
  const navigate = useNavigate()

  if (!menteeAuth.isAuthenticated) {
    return <Navigate to="/portal/login" replace />
  }

  const currentMentee = mentees.find((m) => m.id === menteeAuth.menteeId)

  if (!currentMentee) {
    return <Navigate to="/portal/login" replace />
  }

  const handleLogout = () => {
    logoutMentee()
    navigate('/portal/login')
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
          <span className="text-sm font-medium hidden sm:inline-block">
            Olá, {currentMentee.name.split(' ')[0]}
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
          <Outlet />
        </div>
      </main>
    </div>
  )
}
