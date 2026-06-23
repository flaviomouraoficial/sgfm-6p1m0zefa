import { Outlet, Link, useLocation } from 'react-router-dom'
import { Suspense, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { CalendarDays, LogOut, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando...</p>
      </div>
    </div>
  )
}

const navigation = [{ name: 'Minha Agenda', href: '/portal/agenda', icon: CalendarDays }]

export default function PortalLayout() {
  const { signOut, user } = useAuth()
  const location = useLocation()
  const [sheetOpen, setSheetOpen] = useState(false)

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex h-full flex-col bg-black text-white shadow-xl border-r border-white/10">
      <div className="flex h-28 items-center justify-center border-b border-white/10 bg-black p-5 shrink-0">
        <div className="bg-white rounded-xl p-3 h-full w-full flex items-center justify-center shadow-sm">
          <img
            src="https://img.usecurling.com/i?q=company&shape=fill&color=blue"
            alt="Logo"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
        <nav className="flex-1 space-y-1.5 px-4">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onLinkClick}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white',
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-primary-foreground' : 'text-slate-400 group-hover:text-white',
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-white/10 p-4 bg-black">
        <div className="flex w-full items-center">
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.email || 'Usuário'}
            </p>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" /> Mentorado
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"
            onClick={signOut}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex md:flex-shrink-0 shadow-lg z-20 relative">
        <div className="flex w-64 flex-col">
          <SidebarContent />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <header className="h-16 bg-black flex items-center justify-between px-4 md:px-8 shrink-0 shadow-md z-30">
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/10 -ml-2"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-r-0 bg-black">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <SidebarContent onLinkClick={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <span className="text-primary md:hidden">SGFM</span>
              <span className="hidden md:inline text-primary">Portal do Mentorado</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-8">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
