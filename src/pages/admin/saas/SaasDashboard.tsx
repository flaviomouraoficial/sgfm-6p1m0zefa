import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'

export default function SaasDashboard() {
  const [stats, setStats] = useState({
    totalDiagnostics: 0,
    inProgress: 0,
    activeClients: 0,
    totalRevenue: 0,
  })
  const [pieData, setPieData] = useState<any[]>([])
  const [barData, setBarData] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clients = await pb.collection('users').getList(1, 1, { filter: 'role="client"' })
        const results = await pb
          .collection('v1_saas_results')
          .getFullList({ expand: 'client,diagnostic', sort: '-created' })
        const purchases = await pb
          .collection('v1_saas_credit_purchases')
          .getFullList({ filter: 'status="concluido"' })

        const revenue = purchases.reduce((acc, p) => acc + (p.price_paid || 0), 0)
        const inProgress = results.filter((r) => r.status === 'em_progresso').length

        setStats({
          totalDiagnostics: results.length,
          inProgress,
          activeClients: clients.totalItems,
          totalRevenue: revenue,
        })

        // Pie Data
        const typeCount: Record<string, number> = {}
        results.forEach((r) => {
          const type = r.type || 'outros'
          typeCount[type] = (typeCount[type] || 0) + 1
        })
        setPieData(Object.entries(typeCount).map(([name, value]) => ({ name, value })))

        // Bar Data (Last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const dailyCounts: Record<string, number> = {}

        for (let i = 29; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          dailyCounts[d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })] = 0
        }

        results.forEach((r) => {
          const date = new Date(r.created)
          if (date >= thirtyDaysAgo) {
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            if (dailyCounts[dateStr] !== undefined) {
              dailyCounts[dateStr] += 1
            }
          }
        })
        setBarData(Object.entries(dailyCounts).map(([date, count]) => ({ date, count })))

        // Recent Activities
        setRecentActivities(results.slice(0, 5))
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  const COLORS = ['#1e3a8a', '#10b981', '#fde68a', '#3b82f6']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">Dashboard SaaS</h2>
        <p className="text-muted-foreground">Métricas globais e faturamento da plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Diagnósticos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDiagnostics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#10b981]">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume de Diagnósticos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ count: { color: '#1e3a8a' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                      name="Diagnósticos"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {act.expand?.client?.name || act.expand?.client?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{act.expand?.diagnostic?.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${act.status === 'Concluído' ? 'bg-[#10b981]/20 text-[#10b981]' : act.status === 'em_progresso' ? 'bg-[#fde68a] text-amber-900' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {act.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(act.created).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
