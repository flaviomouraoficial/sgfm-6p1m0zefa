import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/main'
import { LayoutDashboard, Users, PieChart, DollarSign, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import logoUrl from '../assets/logo-21a08.jpg'

const navigation = [
  { name: 'Hub', href: '/', icon: LayoutDashboard },
  { name: 'Mentorados', href: '/mentorados', icon: Users },
  { name: 'Funil de Vendas', href: '/funil', icon: PieChart },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
]

export function Layout() {
  const { logout, user } = useAuthStore()
  const location = useLocation()

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-accent text-accent-foreground">
      <div className="flex h-20 items-center justify-center border-b border-accent-foreground/10 bg-white p-4">
        <img src={logoUrl} alt="Logo Grupo Flávio Moura" className="h-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-2 px-4 text-white">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-accent-foreground/80 hover:bg-secondary hover:text-white',
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
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
      <div className="flex flex-shrink-0 border-t border-accent-foreground/10 p-4">
        <div className="flex w-full items-center">
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name || 'Administrador'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-secondary hover:text-white"
            onClick={logout}
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
          <Button variant="ghost" size="icon" className="absolute left-4 top-4 z-40 md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
