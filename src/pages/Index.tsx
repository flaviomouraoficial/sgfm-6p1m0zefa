import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, CalendarDays, FileText } from 'lucide-react'
import { cloudApi } from '@/lib/cloudApi'
import { useMainStore } from '@/stores/main'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Deal } from '@/lib/types'

export default function Index() {
  const { timeSlots, transactions, proposals } = useMainStore()
  const [deals, setDeals] = useState<Deal[]>([])

  useEffect(() => {
    cloudApi.deals.list().then(setDeals)
  }, [])

  const activeDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length
  const pendingProposals = proposals.filter(
    (p) => p.status === 'Rascunho' || p.status === 'Enviada',
  ).length

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = timeSlots.filter((t) => t.isBooked && t.date === today).length

  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthlyIncome = thisMonthTx
    .filter((t) => t.type === 'Receita')
    .reduce((a, t) => a + t.amount, 0)

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const monthTx = transactions.filter(
        (t) =>
          new Date(t.date).getMonth() === d.getMonth() &&
          new Date(t.date).getFullYear() === d.getFullYear(),
      )
      return {
        name: d.toLocaleString('pt-BR', { month: 'short' }),
        Receita: monthTx.filter((t) => t.type === 'Receita').reduce((a, t) => a + t.amount, 0),
        Despesa: monthTx.filter((t) => t.type === 'Despesa').reduce((a, t) => a + t.amount, 0),
      }
    })
  }, [transactions])

  const chartConfig = {
    Receita: { label: 'Receita', color: 'hsl(var(--primary))' },
    Despesa: { label: 'Despesa', color: 'hsl(var(--destructive))' },
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent">Painel Gerencial</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral e indicadores de performance consolidados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita do Mês"
          value={formatCurrency(monthlyIncome)}
          icon={<DollarSign />}
        />
        <StatCard title="Leads no Funil" value={activeDeals.toString()} icon={<TrendingUp />} />
        <StatCard
          title="Propostas Pendentes"
          value={pendingProposals.toString()}
          icon={<FileText />}
        />
        <StatCard title="Agendamentos Hoje" value={todayAppts.toString()} icon={<CalendarDays />} />
      </div>

      <Card className="mt-6 shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Desempenho Financeiro (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} />
              <RechartsTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="Receita"
                fill="var(--color-Receita)"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
              <Bar
                dataKey="Despesa"
                fill="var(--color-Despesa)"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-accent mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">{icon}</div>
      </CardContent>
    </Card>
  )
}
