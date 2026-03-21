import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/main'
import {
  LayoutDashboard,
  Users,
  PieChart,
  DollarSign,
  LogOut,
  Menu,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import logoUrl from '../assets/logo-21a08.jpg'

const navigation = [
  { name: 'Hub', href: '/', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Mentorados', href: '/mentorados', icon: Users },
  { name: 'Funil de Vendas', href: '/funil', icon: PieChart },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
]

export function Layout() {
  const { logout, user } = useAuthStore()
  const location = useLocation()

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-accent text-accent-foreground shadow-xl">
      <div className="flex h-28 items-center justify-center border-b border-accent-foreground/10 bg-accent p-5 shrink-0">
        <div className="bg-white rounded-xl p-3 h-full w-full flex items-center justify-center shadow-md">
          <img
            src={logoUrl}
            alt="Logo Grupo Flávio Moura"
            className="max-h-full max-w-full object-contain mix-blend-multiply"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
        <nav className="flex-1 space-y-1.5 px-4 text-white">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (location.pathname.startsWith(item.href) && item.href !== '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-accent-foreground/80 hover:bg-secondary hover:text-white',
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-accent-foreground/80 group-hover:text-white',
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-accent-foreground/10 p-4 bg-accent/95">
        <div className="flex w-full items-center">
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Administrador'}
            </p>
            <p className="text-xs text-accent-foreground/60 truncate">Gestão Integrada</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-secondary hover:text-white rounded-full"
            onClick={logout}
            title="Sair do sistema"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-4 z-40 md:hidden bg-white shadow-sm border-border"
          >
            <Menu className="h-5 w-5 text-accent" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 border-r-0">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 shadow-lg z-20 relative">
        <div className="flex w-64 flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-8 pt-16 md:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
