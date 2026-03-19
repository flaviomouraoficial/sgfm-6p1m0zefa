import { useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownRight, ArrowUpRight, DollarSign, Target, AlertCircle } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export default function Index() {
  const { company, transactions, leads, mentees } = useMainStore()

  // Filter logic
  const filteredTx = useMemo(
    () => (company === 'Todas' ? transactions : transactions.filter((t) => t.company === company)),
    [company, transactions],
  )
  const filteredLeads = useMemo(
    () => (company === 'Todas' ? leads : leads.filter((l) => l.company === company)),
    [company, leads],
  )
  const filteredMentees = useMemo(
    () => (company === 'Todas' ? mentees : mentees.filter((m) => m.company === company)),
    [company, mentees],
  )

  // Metrics
  const totalReceber = filteredTx
    .filter((t) => t.type === 'Receita' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const totalPagar = filteredTx
    .filter((t) => t.type === 'Despesa' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const saldoPrevisto = totalReceber - totalPagar

  // Dynamic Cashflow Chart Data (Last 6 months)
  const cashFlowData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' })

      const monthTx = filteredTx.filter((t) => t.date.startsWith(monthKey))
      const Receitas = monthTx
        .filter((t) => t.type === 'Receita')
        .reduce((sum, t) => sum + t.amount, 0)
      const Despesas = monthTx
        .filter((t) => t.type === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0)

      data.push({ name: monthLabel, Receitas, Despesas })
    }
    return data
  }, [filteredTx])

  // Dynamic Category Distribution (Expenses)
  const expensesByCategory = useMemo(() => {
    const expenses = filteredTx.filter((t) => t.type === 'Despesa')
    const grouped = expenses.reduce(
      (acc, t) => {
        const cat = t.category || 'Outros'
        acc[cat] = (acc[cat] || 0) + t.amount
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

  // Alerts
  const mentorshipAlerts = filteredMentees.filter((m) => m.sessions.length >= m.totalSessions - 1)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Visual</h1>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
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
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Funnel */}
        <Card className="shadow-sm">
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

        {/* Alerts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-destructive" /> Alertas de Mentorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mentorshipAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-4">Nenhum alerta no momento.</p>
            ) : (
              <ul className="space-y-3 mt-2">
                {mentorshipAlerts.map((m) => (
                  <li
                    key={m.id}
                    className="flex justify-between items-center text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20"
                  >
                    <span className="font-medium text-destructive">{m.name}</span>
                    <span className="text-destructive/80 font-bold text-xs bg-background/50 px-2 py-1 rounded-sm">
                      {m.sessions.length}/{m.totalSessions} sessões
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
