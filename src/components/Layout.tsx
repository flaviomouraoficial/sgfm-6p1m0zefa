import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useMemo, useEffect } from 'react'
import {
  LayoutDashboard,
  DollarSign,
  Target,
  GraduationCap,
  Users,
  Settings,
  Bell,
  Briefcase,
  AlertCircle,
  Clock,
  MessageCircle,
  Mail,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { useMainStore } from '@/stores/main'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/crm', label: 'Funil de Vendas', icon: Target },
  { path: '/mentorias', label: 'Mentorias', icon: GraduationCap },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Layout() {
  const {
    adminAuth,
    logoutAdmin,
    company,
    setCompany,
    companies,
    transactions,
    clients,
    isSyncing,
    isInitialLoad,
    syncData,
  } = useMainStore()
  const location = useLocation()

  // Trigger sync on navigation to ensure fresh data
  useEffect(() => {
    syncData()
  }, [location.pathname, syncData])

  const alerts = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let txs = transactions || []
    if (company !== 'Todas') txs = txs.filter((t) => t.company === company)

    return txs
      .filter((t) => t.status === 'Pendente')
      .map((t) => {
        if (!t.date) return null
        const d = new Date(t.date)
        if (isNaN(d.getTime())) return null
        d.setHours(0, 0, 0, 0)
        const diffTime = d.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return { ...t, alertType: 'Atrasado', diffDays }
        if (diffDays === 0) return { ...t, alertType: 'Hoje', diffDays }
        return null
      })
      .filter(Boolean)
      .sort((a, b) => a!.diffDays - b!.diffDays) as any[]
  }, [transactions, company])

  if (!adminAuth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

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
            {isSyncing && !isInitialLoad && (
              <div className="flex items-center text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-md animate-pulse">
                <RefreshCw className="w-3 h-3 sm:mr-1.5 animate-spin" />
                <span className="hidden sm:inline">Atualizando</span>
              </div>
            )}

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

            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors relative">
                  <Bell className="w-5 h-5" />
                  {alerts.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      {alerts.length > 9 ? '9+' : alerts.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b font-medium flex items-center justify-between">
                  Central de Notificações
                  <Badge variant="secondary">{alerts.length}</Badge>
                </div>
                <ScrollArea className="max-h-80">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {alerts.map((alert) => {
                        const isReceita = alert.type === 'Receita'

                        let waLink = ''
                        let emailLink = ''
                        if (isReceita && alert.client) {
                          const clientInfo = clients.find((c) => c.name === alert.client)
                          const phone = clientInfo?.phone || '5511999999999'
                          const email = clientInfo?.email || 'contato@cliente.com'
                          const waMsg = `Olá ${alert.client}, notamos que o pagamento de ${formatCurrency(Number(alert.amount) || 0)} referente a ${alert.description} encontra-se pendente. Poderia nos enviar o comprovante?`
                          waLink = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
                          const emailSubject = `Lembrete de Pagamento: ${alert.description}`
                          emailLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(waMsg)}`
                        }

                        return (
                          <div
                            key={alert.id}
                            className="p-3 border-b last:border-0 hover:bg-muted/50 flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1 pr-2">
                                <p className="text-sm font-medium leading-tight">
                                  {alert.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {isReceita ? alert.client : alert.supplier}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'whitespace-nowrap shrink-0',
                                  alert.alertType === 'Atrasado'
                                    ? 'border-destructive text-destructive'
                                    : 'border-yellow-600 text-yellow-600',
                                )}
                              >
                                {alert.alertType === 'Atrasado' ? (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock className="w-3 h-3 mr-1" />
                                )}
                                {alert.alertType}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-bold text-foreground">
                                {formatCurrency(Number(alert.amount) || 0)}
                              </span>
                              {isReceita && (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={waLink || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title="Cobrar via WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                  <a
                                    href={emailLink || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Cobrar via Email"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                  FM
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 text-sm font-semibold border-b mb-1">
                  Flávio Moura
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                    admin@flaviomoura.com.br
                  </span>
                </div>
                <DropdownMenuItem
                  onClick={logoutAdmin}
                  className="text-destructive focus:text-destructive cursor-pointer py-2 mt-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
