import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import React, { useEffect, Suspense, useState } from 'react'
import { useRecentStore } from '@/stores/recent'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAuth, checkIsAdmin } from '@/hooks/use-auth'
import { useMainStore } from '@/stores/main'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  LayoutDashboard,
  Users,
  PieChart,
  DollarSign,
  LogOut,
  Menu,
  CalendarDays,
  FileText,
  BarChart2,
  Settings,
  Cloud,
  Briefcase,
  Shield,
  ClipboardList,
  BookOpen,
  Receipt,
  Target,
  ChevronDown,
  Link as LinkIcon,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'

const routeNames: Record<string, string> = {
  admin: 'Administrativo',
  dashboard: 'Dashboard SaaS',
  agenda: 'Agenda',
  biblioteca: 'Biblioteca',
  painel: 'Painel Admin',
  configuracoes: 'Configurações',
  financeiro: 'Financeiro',
  recibos: 'Recibos',
  relatorios: 'Relatórios',
  prontuarios: 'Prontuários',
  clientes: 'Clientes',
  funil: 'Funil de Vendas',
  propostas: 'Propostas',
  assessments: 'Assessment de Sucessão',
  disc: 'Assessment DISC',
  saas: 'SaaS',
  results: 'Resultados',
  links: 'Links',
  credits: 'Assinatura e Créditos',
  report: 'Relatório',
  settings: 'Configurações',
}

function AppBreadcrumbs() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)
  const search = location.search

  if (paths.length === 0) return null

  const crumbs = []
  let currentPath = ''

  for (let i = 0; i < paths.length; i++) {
    currentPath += `/${paths[i]}`
    let name = routeNames[paths[i]] || paths[i]

    if (paths[i].length > 15) {
      name = 'Detalhes'
    }

    crumbs.push({ name, url: currentPath, isLast: i === paths.length - 1 && !search })
  }

  if (location.pathname.includes('/saas/settings') && search.includes('type=')) {
    const type = new URLSearchParams(search).get('type')
    const typeName =
      type === 'prisma'
        ? 'Prisma'
        : type === 'gestao'
          ? 'Diagnóstico de Gestão'
          : type === 'strategic_360'
            ? 'Strategic 360°'
            : type === 'packages'
              ? 'Pacotes de Créditos'
              : 'Configurações'
    if (crumbs.length > 0) crumbs[crumbs.length - 1].isLast = false
    crumbs.push({ name: typeName, url: location.pathname + search, isLast: true })
  }

  return (
    <Breadcrumb className="mb-4 hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Início</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => (
          <React.Fragment key={crumb.url + index}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="font-bold text-primary">{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.url}>{crumb.name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const menuGroups = [
  {
    name: 'SaaS Diagnósticos',
    icon: Target,
    roles: ['admin'],
    items: [
      {
        name: 'Dashboard SaaS',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        roles: ['admin'],
      },
      {
        name: 'Prisma',
        href: '/admin/saas/settings?type=prisma',
        icon: Target,
        roles: ['admin'],
      },
      {
        name: 'Diagnóstico de Gestão',
        href: '/admin/saas/settings?type=gestao',
        icon: Target,
        roles: ['admin'],
      },
      {
        name: 'Strategic 360°',
        href: '/admin/saas/settings?type=strategic_360',
        icon: Target,
        roles: ['admin'],
      },
      {
        name: 'Relatórios Realizados',
        href: '/admin/saas/results',
        icon: PieChart,
        roles: ['admin'],
      },
      {
        name: 'Gestão de Links',
        href: '/admin/saas/links',
        icon: LinkIcon,
        roles: ['admin'],
      },
      {
        name: 'Assinatura/Créditos',
        href: '/admin/saas/credits',
        icon: DollarSign,
        roles: ['admin'],
      },
      {
        name: 'Pacotes de Créditos',
        href: '/admin/saas/settings?type=packages',
        icon: Settings,
        roles: ['admin'],
      },
      {
        name: 'Assessment de Sucessão',
        href: '/admin/assessments',
        icon: Target,
        roles: ['admin'],
      },
      {
        name: 'Assessment DISC',
        href: '/admin/disc',
        icon: Target,
        roles: ['admin'],
      },
    ],
  },
  {
    name: 'Meu Painel',
    icon: Target,
    roles: ['client'],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['client'] },
      {
        name: 'Assinatura/Créditos',
        href: '/saas/credits',
        icon: DollarSign,
        roles: ['client'],
        perm: 'credits',
      },
      {
        name: 'Meus Resultados',
        href: '/dashboard/results',
        icon: PieChart,
        roles: ['client'],
        perm: 'reports',
      },
    ],
  },
  {
    name: 'Administrativo',
    icon: LayoutDashboard,
    roles: ['admin'],
    items: [
      { name: 'Administrativo', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
      { name: 'Agenda', href: '/admin/agenda', icon: CalendarDays, roles: ['admin'] },
      { name: 'Biblioteca', href: '/admin/biblioteca', icon: BookOpen, roles: ['admin'] },
      { name: 'Painel Admin', href: '/admin/painel', icon: Shield, roles: ['admin'] },
      { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, roles: ['admin'] },
    ],
  },
  {
    name: 'Financeiro',
    icon: DollarSign,
    roles: ['admin'],
    items: [
      { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign, roles: ['admin'] },
      { name: 'Recibos', href: '/admin/recibos', icon: Receipt, roles: ['admin'] },
      { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart2, roles: ['admin'] },
    ],
  },
  {
    name: 'Comercial',
    icon: Briefcase,
    roles: ['admin'],
    items: [
      { name: 'Agenda', href: '/admin/agenda', icon: CalendarDays, roles: ['admin'] },
      { name: 'Prontuários', href: '/admin/prontuarios', icon: ClipboardList, roles: ['admin'] },
      { name: 'Clientes', href: '/admin/clientes', icon: Briefcase, roles: ['admin'] },
      { name: 'Funil de Vendas', href: '/admin/funil', icon: PieChart, roles: ['admin'] },
      { name: 'Propostas', href: '/admin/propostas', icon: FileText, roles: ['admin'] },
    ],
  },
]

export function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Carregando módulo...</p>
      </div>
    </div>
  )
}

function SidebarContent({
  onLinkClick,
  user,
  systemSettings,
  location,
  signOut,
  isCollapsed = false,
  toggleCollapse,
}: {
  onLinkClick?: () => void
  user: any
  systemSettings: any
  location: any
  signOut: () => void
  isCollapsed?: boolean
  toggleCollapse?: () => void
}) {
  const navigate = useNavigate()
  const recentItems = useRecentStore((state) => state.items)
  const [openGroups, setOpenGroups] = useState<string[]>([
    'Administrativo',
    'Financeiro',
    'Comercial',
    'SaaS Diagnósticos',
  ])

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name],
    )
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-black text-white shadow-xl border-r border-white/10 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="flex h-28 items-center justify-center border-b border-white/10 bg-black p-5 shrink-0 relative">
        <div
          className={cn(
            'bg-white rounded-xl flex items-center justify-center shadow-sm transition-all',
            isCollapsed ? 'p-2 h-10 w-10' : 'p-3 h-full w-full',
          )}
        >
          <img
            src={
              systemSettings?.logo || 'https://img.usecurling.com/i?q=company&shape=fill&color=blue'
            }
            alt={systemSettings?.companyName || 'Logo'}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        {toggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="absolute text-slate-400 hover:bg-white/10 hover:text-white hidden md:flex -right-3 top-10 bg-black border border-white/10 w-6 h-6 z-50 rounded-full items-center justify-center p-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-3 w-3" />
            ) : (
              <PanelLeftClose className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4 custom-scrollbar">
        <nav
          data-tour="navigation"
          className={cn('flex-1 space-y-3', isCollapsed ? 'px-2' : 'px-4')}
        >
          {menuGroups
            .filter((group) => {
              if (group.roles.includes('admin') && checkIsAdmin(user)) return true
              return group.roles.includes(user?.role || 'mentee')
            })
            .map((group) => {
              if (isCollapsed) {
                const isActive = group.items.some((i) => {
                  const itemUrl = i.href.split('?')[0]
                  return (
                    location.pathname === itemUrl ||
                    (location.pathname.startsWith(itemUrl + '/') && itemUrl !== '/admin')
                  )
                })

                return (
                  <DropdownMenu key={group.name} modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'flex w-full items-center justify-center rounded-lg p-3 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-slate-400 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <group.icon className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      sideOffset={16}
                      className="w-56 bg-black text-white border-white/10"
                    >
                      <DropdownMenuLabel>{group.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      {group.items
                        .filter((item: any) => {
                          if (item.roles.includes('admin') && checkIsAdmin(user)) return true
                          if (!item.roles.includes(user?.role || 'mentee')) return false
                          if (item.perm && user?.permissions?.[item.perm] === false) return false
                          return true
                        })
                        .map((item: any) => (
                          <DropdownMenuItem
                            key={item.name}
                            asChild
                            className="focus:bg-white/10 focus:text-white cursor-pointer"
                          >
                            <Link
                              to={item.href}
                              onClick={onLinkClick}
                              className="w-full flex items-center"
                            >
                              <item.icon className="mr-2 h-4 w-4 text-slate-400" />
                              {item.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              return (
                <Collapsible
                  key={group.name}
                  open={openGroups.includes(group.name)}
                  onOpenChange={() => toggleGroup(group.name)}
                  className="space-y-1"
                >
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <group.icon className="h-4 w-4" />
                        {group.name}
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          openGroups.includes(group.name) ? '' : '-rotate-90',
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 px-3">
                    {group.items
                      .filter((item: any) => {
                        if (item.roles.includes('admin') && checkIsAdmin(user)) return true
                        if (!item.roles.includes(user?.role || 'mentee')) return false
                        if (item.perm && user?.permissions?.[item.perm] === false) return false
                        return true
                      })
                      .map((item: any) => {
                        const search = location.search
                        const itemUrl = item.href.split('?')[0]
                        const itemQuery = item.href.split('?')[1]

                        const isActive =
                          (itemQuery
                            ? location.pathname === itemUrl && search.includes(itemQuery)
                            : location.pathname === itemUrl) ||
                          (location.pathname.startsWith(itemUrl + '/') && itemUrl !== '/admin')

                        const isCreditsItem =
                          item.name === 'Assinatura/Créditos' ||
                          item.name === 'Comprar Créditos' ||
                          item.name === 'Loja de Créditos'
                        const showBadge =
                          isCreditsItem && user?.role === 'client' && (user?.balance || 0) < 5

                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={onLinkClick}
                            className={cn(
                              'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-slate-400 hover:bg-white/10 hover:text-white',
                            )}
                          >
                            <div className="flex items-center">
                              <item.icon
                                className={cn(
                                  'mr-3 h-4 w-4 flex-shrink-0 transition-colors',
                                  isActive
                                    ? 'text-primary-foreground'
                                    : 'text-slate-500 group-hover:text-white',
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </div>
                            {showBadge && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                                !
                              </span>
                            )}
                          </Link>
                        )
                      })}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
        </nav>

        {!isCollapsed && recentItems.length > 0 && (
          <div className="mt-6 px-4 space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Recentes
            </h3>
            {recentItems.map((item) => (
              <Link
                key={item.id}
                to={item.url}
                onClick={onLinkClick}
                className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200"
                title={item.title}
              >
                <div className="flex items-center truncate">
                  <Clock className="mr-3 h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-white" />
                  <span className="truncate">{item.title}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div
        className={cn(
          'flex flex-shrink-0 border-t border-white/10 bg-black',
          isCollapsed ? 'p-2 justify-center' : 'p-4',
        )}
      >
        {isCollapsed ? (
          <div className="flex flex-col gap-4 items-center py-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  data-tour="theme-switcher"
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                  onClick={async () => {
                    if (!user) return
                    const currentTheme = user.preferences?.theme || 'light'
                    const nextTheme =
                      currentTheme === 'light'
                        ? 'dark'
                        : currentTheme === 'dark'
                          ? 'system'
                          : 'light'
                    const prefs = user.preferences || {}
                    try {
                      await pb
                        .collection('users')
                        .update(user.id, { preferences: { ...prefs, theme: nextTheme } })
                    } catch (err) {
                      console.error('Failed to update theme', err)
                    }
                  }}
                >
                  {user?.preferences?.theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : user?.preferences?.theme === 'system' ? (
                    <Monitor className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black text-white border-white/10 ml-2">
                <p>Alternar Tema</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  data-tour="profile-settings"
                  className="h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-xs font-bold text-primary cursor-help"
                >
                  {user?.name?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    'U'}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black text-white border-white/10 ml-2">
                <p>{user?.name || user?.email || 'Usuário'}</p>
                <p className="text-xs text-slate-400">
                  {user?.role === 'admin' ? 'Administrador' : 'Mentorado'}
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black text-white border-white/10 ml-2">
                <p>Sair do sistema</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div data-tour="profile-settings" className="flex w-full items-center">
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || user?.email || 'Usuário'}
              </p>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3" />{' '}
                {user?.role === 'admin' ? 'Administrador' : 'Mentorado'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button
                data-tour="theme-switcher"
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                onClick={async () => {
                  if (!user) return
                  const currentTheme = user.preferences?.theme || 'light'
                  const nextTheme =
                    currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light'
                  const prefs = user.preferences || {}
                  try {
                    await pb
                      .collection('users')
                      .update(user.id, { preferences: { ...prefs, theme: nextTheme } })
                  } catch (err) {
                    console.error('Failed to update theme', err)
                  }
                }}
                title="Alternar Tema"
              >
                {user?.preferences?.theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : user?.preferences?.theme === 'system' ? (
                  <Monitor className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                onClick={signOut}
                title="Sair do sistema"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Layout() {
  const { signOut, user } = useAuth()

  // Inject primary Navy Blue color #1e3a8a
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', '224 64% 33%')
  }, [])
  const { systemSettings, isInitialLoad, syncData } = useMainStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  useEffect(() => {
    syncData()
  }, [syncData])

  useEffect(() => {
    if (location.pathname.includes('/saas/settings') && location.search.includes('type=')) {
      const type = new URLSearchParams(location.search).get('type')
      const title =
        type === 'prisma'
          ? 'Prisma'
          : type === 'gestao'
            ? 'Diagnóstico de Gestão'
            : type === 'strategic_360'
              ? 'Strategic 360°'
              : type === 'packages'
                ? 'Pacotes de Créditos'
                : null
      if (title) {
        useRecentStore.getState().addItem({
          id: `saas-${type}`,
          title,
          url: location.pathname + location.search,
          iconType: 'target',
        })
      }
    }
  }, [location])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        navigate('/admin/dashboard')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  if (isInitialLoad) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <Cloud className="w-16 h-16 text-primary/20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground">Conectando ao Skip Cloud</h2>
            <p className="text-muted-foreground text-sm font-medium animate-pulse">
              Sincronizando dados corporativos...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TooltipProvider>
        <div className="hidden md:flex md:flex-shrink-0 shadow-lg z-20 relative print:hidden h-full">
          <SidebarContent
            user={user}
            systemSettings={systemSettings}
            location={location}
            signOut={signOut}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={handleToggleCollapse}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          <header className="h-16 bg-black flex items-center justify-between px-4 md:px-8 shrink-0 shadow-md z-30 print:hidden">
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
                  <SidebarContent
                    onLinkClick={() => setSheetOpen(false)}
                    user={user}
                    systemSettings={systemSettings}
                    location={location}
                    signOut={signOut}
                    isCollapsed={false}
                  />
                </SheetContent>
              </Sheet>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span className="text-primary md:hidden">SGFM</span>
                <span className="hidden md:inline text-primary">Grupo Flávio Moura</span>
              </h1>
            </div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 md:hidden">
                <span className="text-xs font-bold text-primary">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </header>

          <main
            data-tour="dashboard-overview"
            className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-8"
          >
            <AppBreadcrumbs />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </TooltipProvider>
    </div>
  )
}
