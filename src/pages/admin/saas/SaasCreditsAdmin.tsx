import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  BarChart,
  Bar,
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
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, Coins, TrendingUp, TrendingDown } from 'lucide-react'

export default function SaasCreditsAdmin() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)

  const fetchPurchases = async () => {
    try {
      const records = await pb.collection('v1_saas_credit_purchases').getFullList({
        filter: 'status="concluido"',
        sort: '-created',
      })
      setPurchases(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  useRealtime('v1_saas_credit_purchases', () => {
    fetchPurchases()
  })

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    years.add(new Date().getFullYear().toString())
    purchases.forEach((p) => {
      years.add(new Date(p.created).getFullYear().toString())
    })
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [purchases])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let totalRevenue = 0
    let totalCredits = 0
    let currentMonthRevenue = 0
    let previousMonthRevenue = 0
    let currentMonthCredits = 0
    let previousMonthCredits = 0

    purchases.forEach((p) => {
      const d = new Date(p.created)
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear
      const isPrevMonth =
        currentMonth === 0
          ? d.getMonth() === 11 && d.getFullYear() === currentYear - 1
          : d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear

      const rev = p.price_paid || 0
      const cred = p.credits || 0

      totalRevenue += rev
      totalCredits += cred

      if (isCurrentMonth) {
        currentMonthRevenue += rev
        currentMonthCredits += cred
      } else if (isPrevMonth) {
        previousMonthRevenue += rev
        previousMonthCredits += cred
      }
    })

    const revGrowth =
      previousMonthRevenue === 0
        ? currentMonthRevenue > 0
          ? 100
          : 0
        : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    const credGrowth =
      previousMonthCredits === 0
        ? currentMonthCredits > 0
          ? 100
          : 0
        : ((currentMonthCredits - previousMonthCredits) / previousMonthCredits) * 100

    return {
      totalRevenue,
      totalCredits,
      revGrowth,
      credGrowth,
    }
  }, [purchases])

  const chartData = useMemo(() => {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    const data = months.map((m) => ({ month: m, revenue: 0, credits: 0 }))

    purchases.forEach((p) => {
      const d = new Date(p.created)
      if (d.getFullYear().toString() === selectedYear) {
        const mIndex = d.getMonth()
        data[mIndex].revenue += p.price_paid || 0
        data[mIndex].credits += p.credits || 0
      }
    })

    return data
  }, [purchases, selectedYear])

  if (loading) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">Financeiro SaaS</h2>
          <p className="text-muted-foreground">
            Monitore o faturamento e volume de créditos vendidos.
          </p>
        </div>
        <div className="w-full md:w-48">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {stats.revGrowth >= 0 ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +{stats.revGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" /> {stats.revGrowth.toFixed(1)}%
                </span>
              )}
              <span className="ml-1">em relação ao mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Créditos Vendidos</CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {stats.credGrowth >= 0 ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +{stats.credGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" /> {stats.credGrowth.toFixed(1)}%
                </span>
              )}
              <span className="ml-1">em relação ao mês anterior</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal ({selectedYear})</CardTitle>
            <CardDescription>Faturamento gerado por vendas de créditos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ revenue: { color: '#10b981' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(val) => `R$ ${val}`} width={80} />
                    <Tooltip
                      content={
                        <ChartTooltipContent formatter={(val) => formatCurrency(val as number)} />
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={[4, 4, 0, 0]}
                      name="Receita"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume de Créditos ({selectedYear})</CardTitle>
            <CardDescription>Total de créditos comercializados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ credits: { color: '#3b82f6' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis width={40} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="credits"
                      stroke="var(--color-credits)"
                      strokeWidth={3}
                      name="Créditos"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
