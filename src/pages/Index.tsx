import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Clock, CheckCircle2, Target, Users, Settings } from 'lucide-react'
import { cloudApi } from '@/lib/cloudApi'
import { useMainStore } from '@/stores/main'
import { formatCurrency, cn } from '@/lib/utils'
import { ForecastModal } from '@/components/dashboard/ForecastModal'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ComposedChart,
  Bar,
  Line,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Deal } from '@/lib/types'

function StatCard({ title, value, icon, className, subtitle }: any) {
  return (
    <Card className={cn('shadow-sm hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4 mb-2">
          <span className="text-sm font-semibold text-muted-foreground">{title}</span>
          <div className="p-2 bg-muted rounded-full text-foreground/70">{icon}</div>
        </div>
        <div className="space-y-1">
          <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
          {subtitle && <p className="text-[10px] text-muted-foreground font-medium">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Index() {
  const { transactions, financialForecasts, annualRevenueTarget } = useMainStore()
  const [deals, setDeals] = useState<Deal[]>([])
  const [isForecastOpen, setForecastOpen] = useState(false)

  useEffect(() => {
    cloudApi.deals.list().then(setDeals)
  }, [])

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  let received = 0,
    paid = 0,
    pendingIncome = 0,
    pendingExpense = 0,
    overdueIncome = 0,
    overdueExpense = 0

  transactions.forEach((t) => {
    const isIncome = t.type === 'Receita'
    if (t.status === 'Pago') {
      if (isIncome) received += t.amount
      else paid += t.amount
    } else {
      const d = new Date(t.date + 'T00:00:00')
      if (d < now) {
        if (isIncome) overdueIncome += t.amount
        else overdueExpense += t.amount
      } else {
        if (isIncome) pendingIncome += t.amount
        else pendingExpense += t.amount
      }
    }
  })

  const currentYear = new Date().getFullYear()
  const currentYearTxs = transactions.filter(
    (t) => t.date.startsWith(currentYear.toString()) && t.status === 'Pago',
  )
  const actualIncome = currentYearTxs
    .filter((t) => t.type === 'Receita')
    .reduce((a, b) => a + b.amount, 0)
  const actualExpense = currentYearTxs
    .filter((t) => t.type === 'Despesa')
    .reduce((a, b) => a + b.amount, 0)
  const revenueProgress = Math.min(100, (actualIncome / (annualRevenueTarget || 1)) * 100)

  const activeDeals = deals.filter((d) => ['lead', 'contact', 'proposal'].includes(d.stage))
  const funnelStages = [
    { id: 'lead', label: 'Leads (Topo)', color: 'bg-primary' },
    { id: 'contact', label: 'Contato Feito (Meio)', color: 'bg-secondary' },
    { id: 'proposal', label: 'Proposta (Fundo)', color: 'bg-accent' },
  ]

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`
      const monthTxs = transactions.filter(
        (t) => t.date.startsWith(monthStr) && t.status === 'Pago',
      )
      const mInc = monthTxs.filter((t) => t.type === 'Receita').reduce((s, t) => s + t.amount, 0)
      const mExp = monthTxs.filter((t) => t.type === 'Despesa').reduce((s, t) => s + t.amount, 0)
      const forecast = financialForecasts?.find((f) => f.month === monthStr) || {
        expectedIncome: 0,
        expectedExpense: 0,
      }

      return {
        month: new Date(currentYear, i, 1)
          .toLocaleString('pt-BR', { month: 'short' })
          .toUpperCase(),
        receitaRealizada: mInc,
        despesaRealizada: mExp,
        receitaPrevista: forecast.expectedIncome,
        despesaPrevista: forecast.expectedExpense,
      }
    })
  }, [transactions, financialForecasts, currentYear])

  const chartConfig = {
    receitaRealizada: { label: 'Receita Realizada', color: 'hsl(var(--primary))' },
    despesaRealizada: { label: 'Despesa Realizada', color: 'hsl(var(--accent))' },
    receitaPrevista: { label: 'Receita Prevista', color: 'hsl(var(--primary))' },
    despesaPrevista: { label: 'Despesa Prevista', color: 'hsl(var(--accent))' },
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Dashboard Estratégico</h1>
          <p className="text-muted-foreground mt-1">
            Visão executiva de performance, caixa e funil.
          </p>
        </div>
        <Button onClick={() => setForecastOpen(true)} className="bg-primary hover:bg-secondary">
          <Settings className="w-4 h-4 mr-2" /> Configurar Metas
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Recebidos"
          value={formatCurrency(received)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Pagos"
          value={formatCurrency(paid)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          className="border-l-4 border-l-secondary"
        />
        <StatCard
          title="Valores Pendentes"
          value={formatCurrency(pendingIncome + pendingExpense)}
          icon={<Clock className="w-5 h-5" />}
          className="border-l-4 border-l-amber-500"
          subtitle={`Rec: ${formatCurrency(pendingIncome)} | Desp: ${formatCurrency(pendingExpense)}`}
        />
        <StatCard
          title="Em Atraso"
          value={formatCurrency(overdueIncome + overdueExpense)}
          icon={<AlertCircle className="w-5 h-5" />}
          className="border-l-4 border-l-destructive"
          subtitle={`Rec: ${formatCurrency(overdueIncome)} | Desp: ${formatCurrency(overdueExpense)}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-accent">
              <Target className="w-5 h-5" /> Desempenho Anual vs Meta
            </CardTitle>
            <CardDescription>Progresso do faturamento em {currentYear}.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-muted-foreground">Receita Alcançada</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(actualIncome)} / {formatCurrency(annualRevenueTarget || 0)}
                  </span>
                </div>
                <Progress value={revenueProgress} className="h-3 bg-primary/20" />
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-muted-foreground">Despesas Acumuladas</span>
                  <span className="font-bold text-accent">{formatCurrency(actualExpense)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 flex flex-col">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-accent">
              <Users className="w-5 h-5" /> Funil de Vendas (Ativos)
            </CardTitle>
            <CardDescription>Clientes e Leads nas etapas de negociação.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-center">
            <div className="space-y-5">
              {funnelStages.map((s) => {
                const count = deals.filter((d) => d.stage === s.id).length
                const totalActive = activeDeals.length || 1
                const pct = (count / totalActive) * 100
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold text-muted-foreground">{s.label}</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                      <div
                        className={cn('h-full transition-all duration-500', s.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Previsto vs Realizado ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} />
              <RechartsTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="receitaRealizada"
                fill="var(--color-receitaRealizada)"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="despesaRealizada"
                fill="var(--color-despesaRealizada)"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                type="monotone"
                dataKey="receitaPrevista"
                stroke="var(--color-receitaPrevista)"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="despesaPrevista"
                stroke="var(--color-despesaPrevista)"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                opacity={0.5}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <ForecastModal open={isForecastOpen} onOpenChange={setForecastOpen} />
    </div>
  )
}
