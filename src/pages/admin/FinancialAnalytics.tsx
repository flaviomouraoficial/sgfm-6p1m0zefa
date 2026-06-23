import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'
import { subDays, subMonths, isAfter, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Period = '7days' | '30days' | '12months'

export default function FinancialAnalytics() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('30days')

  const fetchData = async () => {
    try {
      const [purchasesData, transactionsData] = await Promise.all([
        pb.collection('v1_saas_credit_purchases').getFullList({ filter: 'status="concluido"' }),
        pb
          .collection('v1_transactions')
          .getFullList({ filter: 'type="Receita" || type="Crédito"' }),
      ])
      setPurchases(purchasesData)
      setTransactions(transactionsData)
    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useRealtime('v1_saas_credit_purchases', () => fetchData(), true)
  useRealtime('v1_transactions', () => fetchData(), true)

  const { chartData, totalRevenue, completedPurchasesCount, averageTicketValue } = useMemo(() => {
    const now = new Date()
    let startDate = new Date()

    if (period === '7days') startDate = subDays(now, 7)
    else if (period === '30days') startDate = subDays(now, 30)
    else if (period === '12months') startDate = subMonths(now, 12)

    const filteredPurchases = purchases.filter((p) => isAfter(parseISO(p.created), startDate))
    const filteredTransactions = transactions.filter((t) => {
      const dateStr = t.date ? t.date.split(' ')[0] : t.created
      return isAfter(parseISO(dateStr), startDate)
    })

    const aggregated: Record<string, { dateLabel: string; revenue: number; purchases: number }> = {}

    const addData = (dateISO: string, amount: number, isPurchase: boolean) => {
      const formatStr = period === '12months' ? 'MMM yyyy' : 'dd/MM'
      const dateObj = parseISO(dateISO)
      const key = format(dateObj, period === '12months' ? 'yyyy-MM' : 'yyyy-MM-dd')

      if (!aggregated[key]) {
        aggregated[key] = {
          dateLabel: format(dateObj, formatStr, { locale: ptBR }),
          revenue: 0,
          purchases: 0,
        }
      }
      aggregated[key].revenue += amount
      if (isPurchase) aggregated[key].purchases += 1
    }

    filteredPurchases.forEach((p) => addData(p.created, p.price_paid || 0, true))

    filteredTransactions.forEach((t) => {
      const d = t.date ? t.date.split(' ')[0] : t.created
      addData(d, t.amount || 0, false)
    })

    const sortedKeys = Object.keys(aggregated).sort()
    const finalChartData = sortedKeys.map((k) => aggregated[k])

    let revenueSum = 0
    let purchasesCount = 0

    finalChartData.forEach((d) => {
      revenueSum += d.revenue
      purchasesCount += d.purchases
    })

    return {
      chartData: finalChartData,
      totalRevenue: revenueSum,
      completedPurchasesCount: purchasesCount,
      averageTicketValue: purchasesCount > 0 ? revenueSum / purchasesCount : 0,
    }
  }, [purchases, transactions, period])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1e3a8a] flex items-center gap-2">
            <TrendingUp className="w-8 h-8" /> Análise Financeira
          </h2>
          <p className="text-muted-foreground">Métricas avançadas e crescimento de receita.</p>
        </div>
        <Select value={period} onValueChange={(val: Period) => setPeriod(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="12months">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total do Período</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Concluídas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPurchasesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(averageTicketValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crescimento de Receita</CardTitle>
          <CardDescription>Evolução da receita agregada no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {chartData.length > 0 ? (
              <ChartContainer config={{ revenue: { color: '#1e3a8a' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis
                      tickFormatter={(value) => `R$ ${value}`}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      content={<ChartTooltipContent formatter={(v: number) => formatCurrency(v)} />}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--color-revenue)' }}
                      activeDot={{ r: 6 }}
                      name="Receita"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Nenhum dado para o período selecionado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
