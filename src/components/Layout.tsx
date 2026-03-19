import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  DollarSign,
  Target,
  GraduationCap,
  Users,
  Settings,
  Bell,
  Briefcase,
} from 'lucide-react'
import { useMainStore } from '@/stores/main'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/crm', label: 'Funil de Vendas', icon: Target },
  { path: '/mentorias', label: 'Mentorias', icon: GraduationCap },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Layout() {
  const { company, setCompany, companies } = useMainStore()
  const location = useLocation()

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground hidden md:flex flex-col flex-shrink-0 print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-primary-foreground/10">
          <Briefcase className="w-6 h-6 text-accent mr-3" />
          <span className="font-bold text-lg tracking-tight">Flávio Moura</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'hover:bg-primary-foreground/10',
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 mr-3',
                    isActive ? 'text-accent-foreground' : 'text-primary-foreground/70',
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm print:hidden">
          <div className="flex items-center space-x-4 flex-1">
            <h2 className="text-xl font-semibold hidden sm:block">
              {navItems.find((i) => i.path === location.pathname)?.label || 'Sistema'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={company} onValueChange={(v) => setCompany(v)}>
              <SelectTrigger className="w-[220px] h-9 border-input bg-background shadow-sm text-xs font-medium">
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as Empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button className="p-2 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            </button>

            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-sm">
              FM
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background/50 print:p-0 print:bg-white">
          <div className="max-w-7xl mx-auto animate-fade-in print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
