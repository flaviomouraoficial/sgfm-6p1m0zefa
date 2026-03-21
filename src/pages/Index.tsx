import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, DollarSign, Activity, CalendarDays } from 'lucide-react'
import { cloudApi } from '@/lib/cloudApi'
import { useMainStore } from '@/stores/main'
import { formatCurrency } from '@/lib/utils'

export default function Index() {
  const { mentees, timeSlots } = useMainStore()
  const [stats, setStats] = useState({
    activeDeals: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  })

  // Derive stats from main store directly for mentoring & agenda
  const activeMentees = useMemo(() => mentees.filter((c) => c.status === 'Ativo').length, [mentees])
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return timeSlots.filter((t) => t.isBooked && new Date(t.date) >= now).length
  }, [timeSlots])

  useEffect(() => {
    const fetchStats = async () => {
      const [deals, transactions] = await Promise.all([
        cloudApi.deals.list(),
        cloudApi.transactions.list(),
      ])

      const now = new Date()
      const thisMonthTx = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })

      const income = thisMonthTx
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0)
      const expense = thisMonthTx
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0)

      setStats({
        activeDeals: deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length,
        monthlyIncome: income,
        monthlyExpense: expense,
      })
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">Resumo operacional do Grupo Flávio Moura.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mentorados Ativos
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{activeMentees}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximos Agendamentos
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{upcomingEvents}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Negócios no Funil
            </CardTitle>
            <div className="p-2 bg-secondary/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.activeDeals}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita (Mês)
            </CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-accent">
              {formatCurrency(stats.monthlyIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas (Mês)
            </CardTitle>
            <div className="p-2 bg-destructive/10 rounded-full">
              <Activity className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-accent">
              {formatCurrency(stats.monthlyExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-border/60">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-base flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" /> Atividade e Integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                O painel de atividades está operando normalmente. O módulo de{' '}
                <strong>Agenda</strong> e <strong>Mentorados</strong> agora estão totalmente
                integrados.
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium border border-green-200">
                  Integração Agenda OK
                </span>
                <span className="px-2.5 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium border border-green-200">
                  Prontuários Ativos
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                  CRM Cloud Sincronizado
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
