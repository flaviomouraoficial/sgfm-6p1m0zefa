import { useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { StatCard } from '@/components/dashboard/StatCard'
import { GoalCard } from '@/components/dashboard/GoalCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Target,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

export default function Index() {
  const {
    company,
    transactions,
    leads,
    mentees,
    revenueGoal,
    setRevenueGoal,
    timeSlots,
    isInitialLoad,
  } = useMainStore()

  // Filter logic safely
  const filteredTx = useMemo(
    () =>
      company === 'Todas'
        ? transactions || []
        : (transactions || []).filter((t) => t.company === company),
    [company, transactions],
  )
  const filteredLeads = useMemo(
    () => (company === 'Todas' ? leads || [] : (leads || []).filter((l) => l.company === company)),
    [company, leads],
  )
  const filteredMentees = useMemo(
    () =>
      company === 'Todas' ? mentees || [] : (mentees || []).filter((m) => m.company === company),
    [company, mentees],
  )

  // Upcoming Bookings for Agenda
  const upcomingBookings = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return (timeSlots || [])
      .filter((t) => t.isBooked && new Date(t.date + 'T00:00:00') >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5)
  }, [timeSlots])

  const currentMonthRevenue = useMemo(() => {
    const now = new Date()
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return filteredTx
      .filter(
        (t) =>
          t.type === 'Receita' &&
          t.status === 'Pago' &&
          (t.date || '').startsWith(currentMonthPrefix),
      )
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  }, [filteredTx])

  // Dynamic Cashflow Chart Data (Last 6 months)
  const cashFlowData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' })

      const monthTx = filteredTx.filter((t) => (t.date || '').startsWith(monthKey))
      const Receitas = monthTx
        .filter((t) => t.type === 'Receita')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      const Despesas = monthTx
        .filter((t) => t.type === 'Despesa')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      data.push({ name: monthLabel, Receitas, Despesas })
    }
    return data
  }, [filteredTx])

  // Year-over-Year (YoY) Performance Data
  const yoyData = useMemo(() => {
    const data = []
    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1

    for (let i = 0; i < 12; i++) {
      const monthLabel = new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'short' })
      const monthStr = String(i + 1).padStart(2, '0')

      const currentYearPrefix = `${currentYear}-${monthStr}`
      const previousYearPrefix = `${previousYear}-${monthStr}`

      const currentYearRevenue = filteredTx
        .filter(
          (t) =>
            t.type === 'Receita' &&
            t.status === 'Pago' &&
            (t.date || '').startsWith(currentYearPrefix),
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      const previousYearRevenue = filteredTx
        .filter(
          (t) =>
            t.type === 'Receita' &&
            t.status === 'Pago' &&
            (t.date || '').startsWith(previousYearPrefix),
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      data.push({
        name: monthLabel,
        anoAtual: currentYearRevenue,
        anoAnterior: previousYearRevenue,
      })
    }
    return data
  }, [filteredTx])

  // Future Revenue Projection Data (Next 6 months)
  const projectionData = useMemo(() => {
    const data = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' })

      const expectedRevenue = filteredTx
        .filter(
          (t) =>
            t.type === 'Receita' && t.status === 'Pendente' && (t.date || '').startsWith(monthKey),
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      data.push({ name: monthLabel, Projetado: expectedRevenue })
    }
    return data
  }, [filteredTx])

  // Dynamic Category Distribution (Expenses)
  const expensesByCategory = useMemo(() => {
    const expenses = filteredTx.filter((t) => t.type === 'Despesa')
    const grouped = expenses.reduce(
      (acc, t) => {
        const cat = t.category || 'Outros'
        acc[cat] = (acc[cat] || 0) + (Number(t.amount) || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(grouped)
      .map(([name, value], index) => {
        const safeKey = `cat_${index}`
        return {
          name,
          value,
          safeKey,
          fill: `var(--color-${safeKey})`,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [filteredTx])

  const pieChartConfig = useMemo(() => {
    const config: Record<string, any> = { value: { label: 'Valor' } }
    expensesByCategory.forEach((item, index) => {
      config[item.safeKey] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }
    })
    return config
  }, [expensesByCategory])

  // Funnel Data
  const funnelData = useMemo(() => {
    const stages = [
      'Prospecção',
      'Reunião de Diagnóstico',
      'Geração de Proposta',
      'Apresentação da Proposta',
      'Negociando',
      'Fechado',
    ]
    return stages.map((stage) => ({
      name: stage,
      count: filteredLeads.filter((l) => l.status === stage).length,
    }))
  }, [filteredLeads])

  if (isInitialLoad) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[380px] w-full" />
          <Skeleton className="h-[380px] w-full" />
        </div>
      </div>
    )
  }

  // Metrics safely parsing numbers
  const totalReceber = filteredTx
    .filter((t) => t.type === 'Receita' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  const totalPagar = filteredTx
    .filter((t) => t.type === 'Despesa' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  const saldoPrevisto = totalReceber - totalPagar

  // Alerts - handle potentially undefined sessions
  const mentorshipAlerts = filteredMentees.filter(
    (m) => (m.sessions || []).length >= m.totalSessions - 1,
  )

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Visual</h1>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total a Receber"
          value={formatCurrency(totalReceber)}
          icon={<ArrowUpRight className="w-6 h-6" />}
          trend="+12%"
          isPositive={true}
        />
        <StatCard
          title="Total a Pagar"
          value={formatCurrency(totalPagar)}
          icon={<ArrowDownRight className="w-6 h-6" />}
          trend="-5%"
          isPositive={true}
        />
        <StatCard
          title="Saldo Previsto"
          value={formatCurrency(saldoPrevisto)}
          icon={<DollarSign className="w-6 h-6" />}
          isPositive={saldoPrevisto >= 0}
        />
        <GoalCard
          current={currentMonthRevenue}
          goal={revenueGoal || 20000}
          onUpdateGoal={setRevenueGoal}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Receitas: { color: 'hsl(var(--chart-2))', label: 'Receitas' },
                Despesas: { color: 'hsl(var(--chart-4))', label: 'Despesas' },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="Receitas"
                  fill="var(--color-Receitas)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Bar
                  dataKey="Despesas"
                  fill="var(--color-Despesas)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhuma despesa registrada.
              </div>
            ) : (
              <ChartContainer config={pieChartConfig} className="h-[300px] w-full pb-4">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {expensesByCategory.map((entry) => (
                      <Cell key={entry.safeKey} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* YoY Chart */}
        <Card className="shadow-sm lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" /> Desempenho Anual (YoY) - Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                anoAtual: {
                  color: 'hsl(var(--primary))',
                  label: `Ano Atual (${new Date().getFullYear()})`,
                },
                anoAnterior: {
                  color: 'hsl(var(--muted-foreground))',
                  label: `Ano Anterior (${new Date().getFullYear() - 1})`,
                },
              }}
              className="h-[300px] w-full mt-4"
            >
              <BarChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  fontSize={11}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R${v / 1000}k`}
                  fontSize={11}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="anoAtual"
                  fill="var(--color-anoAtual)"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="anoAnterior"
                  fill="var(--color-anoAnterior)"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Projection Chart */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" /> Projeção de Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Projetado: { color: 'hsl(var(--chart-1))', label: 'Receita Projetada' },
              }}
              className="h-[180px] w-full mt-4"
            >
              <LineChart data={projectionData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  fontSize={11}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="Projetado"
                  stroke="var(--color-Projetado)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-Projetado)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2 text-accent" /> Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ count: { color: 'hsl(var(--primary))', label: 'Leads' } }}
              className="h-[180px] w-full"
            >
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Agenda */}
        <Card className="shadow-sm lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" /> Próximas Sessões
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4">
            {upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <Calendar className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Nenhuma sessão agendada para os próximos dias.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingBookings.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex flex-col text-sm p-3 bg-primary/5 rounded-md border border-primary/10 transition-colors hover:bg-primary/10"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-primary line-clamp-1 mr-2">
                        {slot.menteeName}
                      </span>
                      <span className="text-xs font-bold bg-background px-2 py-1 rounded-sm shadow-sm border border-border/50 shrink-0">
                        {new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        às {slot.time}
                      </span>
                    </div>
                    {(slot.menteeCompany || slot.description) && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {slot.menteeCompany ? `${slot.menteeCompany}` : ''}
                        {slot.menteeCompany && slot.description ? ' - ' : ''}
                        {slot.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="shadow-sm lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-destructive" /> Alertas de Mentorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mentorshipAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-4">Nenhum alerta no momento.</p>
            ) : (
              <ul className="space-y-3 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentorshipAlerts.map((m) => (
                  <li
                    key={m.id}
                    className="flex justify-between items-center text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20"
                  >
                    <span className="font-medium text-destructive">{m.name}</span>
                    <span className="text-destructive/80 font-bold text-xs bg-background/50 px-2 py-1 rounded-sm">
                      {(m.sessions || []).length}/{m.totalSessions} sessões
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
