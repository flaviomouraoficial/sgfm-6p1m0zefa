import { useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownRight, ArrowUpRight, DollarSign, Target, AlertCircle } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'

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

  // Mock Cashflow Chart Data
  const cashFlowData = [
    { name: 'Out', Receitas: 12000, Despesas: 8000 },
    { name: 'Nov', Receitas: 15000, Despesas: 9500 },
    { name: 'Dez', Receitas: 18000, Despesas: 11000 },
    { name: 'Jan', Receitas: 14000, Despesas: 7000 },
    { name: 'Fev', Receitas: 22000, Despesas: 12000 },
    { name: 'Mar', Receitas: 28000, Despesas: 10000 },
  ]

  // Alerts
  const mentorshipAlerts = filteredMentees.filter((m) => m.sessions.length >= m.totalSessions - 1)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total a Receber"
          value={`R$ ${totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<ArrowUpRight className="w-6 h-6" />}
          trend="+12%"
          isPositive={true}
        />
        <StatCard
          title="Total a Pagar"
          value={`R$ ${totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<ArrowDownRight className="w-6 h-6" />}
          trend="-5%"
          isPositive={true}
        />
        <StatCard
          title="Saldo Previsto"
          value={`R$ ${saldoPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Fluxo de Caixa (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Receitas: { color: 'hsl(var(--chart-3))', label: 'Receitas' },
                Despesas: { color: 'hsl(var(--chart-4))', label: 'Despesas' },
              }}
              className="h-[300px] w-full"
            >
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="Receitas"
                  stroke="var(--color-Receitas)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Despesas"
                  stroke="var(--color-Despesas)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Funnel & Alerts */}
        <div className="space-y-6">
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
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 4, 4, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-destructive" /> Alertas Mentorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentorshipAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
              ) : (
                <ul className="space-y-3">
                  {mentorshipAlerts.map((m) => (
                    <li
                      key={m.id}
                      className="flex justify-between items-center text-sm p-2 bg-destructive/10 rounded-md border border-destructive/20"
                    >
                      <span className="font-medium text-destructive">{m.name}</span>
                      <span className="text-destructive/80 font-bold text-xs">
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
    </div>
  )
}
