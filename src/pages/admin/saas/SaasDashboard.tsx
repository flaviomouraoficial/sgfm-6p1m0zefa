import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Users, CheckCircle, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

export default function SaasDashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDiagnostics: 0,
    completed: 0,
    avgScore: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clients = await pb.collection('users').getList(1, 1, { filter: 'role="client"' })
        const results = await pb.collection('v1_saas_results').getFullList()

        const completed = results.filter((r) => r.status === 'Concluído')
        let totalScore = 0
        const scoresByMonth: Record<string, { total: number; count: number }> = {}

        completed.forEach((r) => {
          const score = r.result_json?.overall || 0
          totalScore += score

          const month = new Date(r.completed_at).toLocaleString('pt-BR', { month: 'short' })
          if (!scoresByMonth[month]) scoresByMonth[month] = { total: 0, count: 0 }
          scoresByMonth[month].total += score
          scoresByMonth[month].count += 1
        })

        setStats({
          totalClients: clients.totalItems,
          totalDiagnostics: results.length,
          completed: completed.length,
          avgScore: completed.length ? totalScore / completed.length : 0,
        })

        const cData = Object.keys(scoresByMonth).map((m) => ({
          name: m,
          score: parseFloat((scoresByMonth[m].total / scoresByMonth[m].count).toFixed(1)),
        }))
        setChartData(cData)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard SaaS</h2>
        <p className="text-muted-foreground">
          Métricas globais de diagnósticos e uso da plataforma.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diagnósticos Iniciados</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDiagnostics}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDiagnostics
                ? Math.round((stats.completed / stats.totalDiagnostics) * 100)
                : 0}
              % taxa de conclusão
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média Global (Score)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)} / 5.0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Média de Score por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={{ score: { color: 'hsl(var(--primary))' } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="score"
                    fill="var(--color-score)"
                    radius={[4, 4, 0, 0]}
                    name="Média Geral"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
