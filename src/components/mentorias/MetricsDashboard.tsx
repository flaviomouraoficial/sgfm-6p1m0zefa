import { useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { CalendarDays, CheckCircle2, UserX } from 'lucide-react'

export function MetricsDashboard() {
  const { mentees } = useMainStore()

  const { totalScheduled, totalCompleted, totalMissed, absenceRate } = useMemo(() => {
    let sch = 0,
      comp = 0,
      miss = 0

    mentees.forEach((m) => {
      ;(m.sessions || []).forEach((s) => {
        if (s.status === 'Realizada') comp++
        else if (s.status === 'Falta') miss++
        else if (s.status === 'Agendada') sch++
        else {
          if (new Date(s.date) < new Date()) comp++
          else sch++
        }
      })
    })

    const totalOccurred = comp + miss
    const rate = totalOccurred > 0 ? (miss / totalOccurred) * 100 : 0

    return {
      totalScheduled: sch + comp + miss,
      totalCompleted: comp,
      totalMissed: miss,
      absenceRate: rate.toFixed(1),
    }
  }, [mentees])

  const chartData = useMemo(() => {
    const data: Record<string, { name: string; Realizadas: number; Faltas: number }> = {}

    mentees.forEach((m) => {
      ;(m.sessions || []).forEach((s) => {
        const d = new Date(s.date)
        if (isNaN(d.getTime())) return

        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleString('pt-BR', { month: 'short' })

        if (!data[key]) data[key] = { name: label, Realizadas: 0, Faltas: 0 }

        const isRealizada = s.status === 'Realizada' || (!s.status && d < new Date())
        const isFalta = s.status === 'Falta'

        if (isRealizada) data[key].Realizadas++
        if (isFalta) data[key].Faltas++
      })
    })

    return Object.keys(data)
      .sort()
      .slice(-6)
      .map((k) => data[k])
  }, [mentees])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScheduled}</div>
            <p className="text-xs text-muted-foreground mt-1">Agendadas e ocorridas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">Concluídas com sucesso</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ausência (No-Show)</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{absenceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{totalMissed} faltas registradas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Engajamento Mensal</CardTitle>
          <CardDescription>Sessões realizadas vs faltas nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
              Nenhuma sessão registrada para o gráfico.
            </div>
          ) : (
            <ChartContainer
              config={{
                Realizadas: { label: 'Realizadas', color: 'hsl(var(--chart-2))' },
                Faltas: { label: 'Faltas', color: 'hsl(var(--destructive))' },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="Realizadas"
                  fill="var(--color-Realizadas)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Bar
                  dataKey="Faltas"
                  fill="var(--color-Faltas)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
