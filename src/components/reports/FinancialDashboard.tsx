import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { FinancialMetrics, getMonthlyTrends } from '@/lib/financial'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Transaction } from '@/lib/types'
import { useMainStore } from '@/stores/main'

export function FinancialDashboard({
  metrics,
  allTransactions,
}: {
  metrics: FinancialMetrics
  allTransactions: Transaction[]
}) {
  const { annualRevenueTarget } = useMainStore()
  const chartData = useMemo(() => getMonthlyTrends(allTransactions, 12), [allTransactions])

  const planVsRealData = useMemo(() => {
    const monthlyTarget = annualRevenueTarget / 12
    return chartData.map((d) => ({
      month: d.month,
      Realizado: d.inflows,
      Planejado: monthlyTarget,
    }))
  }, [chartData, annualRevenueTarget])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Líquida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(metrics.netRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">EBITDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.ebitda)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.netProfit)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margem Operacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.operatingMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Receitas: Planejado vs. Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Realizado: { color: 'hsl(var(--primary))', label: 'Realizado' },
                Planejado: { color: '#94a3b8', label: 'Planejado' },
              }}
              className="h-[350px] w-full"
            >
              <BarChart data={planVsRealData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis tickFormatter={(v) => `R$ ${v / 1000}k`} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="Realizado" fill="var(--color-Realizado)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Planejado" fill="var(--color-Planejado)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Evolução do EBITDA e Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ebitda: { color: 'hsl(var(--primary))', label: 'EBITDA' },
                netProfit: { color: '#22c55e', label: 'Lucro Líquido' },
              }}
              className="h-[350px] w-full"
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis tickFormatter={(v) => `R$ ${v / 1000}k`} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="ebitda"
                  stroke="var(--color-ebitda)"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  stroke="var(--color-netProfit)"
                  strokeWidth={3}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
