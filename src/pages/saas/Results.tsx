import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Download, ArrowLeft, GitCompare } from 'lucide-react'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export default function Results() {
  const [searchParams] = useSearchParams()
  const resultId = searchParams.get('id')
  const { user } = useAuth()

  const [allResults, setAllResults] = useState<any[]>([])
  const [primaryResult, setPrimaryResult] = useState<any>(null)
  const [compareResultId, setCompareResultId] = useState<string>('none')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await pb.collection('v1_saas_results').getFullList({
          filter: `client = "${user.id}" && status = "Concluído"`,
          sort: '-completed_at',
          expand: 'diagnostic',
        })
        setAllResults(res)

        if (resultId) {
          const main = res.find((r) => r.id === resultId)
          if (main) setPrimaryResult(main)
          else if (res.length > 0) setPrimaryResult(res[0])
        } else if (res.length > 0) {
          setPrimaryResult(res[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [user.id, resultId])

  if (loading) return <div className="p-8">Carregando resultados...</div>
  if (!primaryResult)
    return <div className="p-8 text-center">Nenhum resultado concluído encontrado.</div>

  const compareResult =
    compareResultId !== 'none' ? allResults.find((r) => r.id === compareResultId) : null

  const scores = primaryResult.result_json?.scores || {}
  const compScores = compareResult?.result_json?.scores || {}

  const radarData = Object.keys(scores).map((key) => ({
    subject: key,
    A: scores[key],
    ...(compareResult ? { B: compScores[key] || 0 } : {}),
  }))

  const getClassificationColor = (c: string) => {
    switch (c) {
      case 'Estrela':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Manter':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Desenvolvimento':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'Risco':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <Button variant="ghost" asChild className="-ml-4 mb-2 text-muted-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Painel
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Relatório de Diagnóstico</h2>
          <p className="text-muted-foreground">{primaryResult.expand?.diagnostic?.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <GitCompare className="h-4 w-4 text-muted-foreground" />
            <Select value={compareResultId} onValueChange={setCompareResultId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Comparar com..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem comparação</SelectItem>
                {allResults
                  .filter((r) => r.id !== primaryResult.id)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {new Date(r.completed_at).toLocaleDateString()}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="print-area space-y-8">
        <div className="hidden print:block mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold">Relatório Executivo</h1>
          <p className="text-lg text-muted-foreground">
            {primaryResult.expand?.diagnostic?.title} -{' '}
            {new Date(primaryResult.completed_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Classificação Final</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div
                className={cn(
                  'px-6 py-3 rounded-full text-2xl font-bold border-2 mb-4',
                  getClassificationColor(primaryResult.result_json?.classification),
                )}
              >
                {primaryResult.result_json?.classification || 'N/A'}
              </div>
              <p className="text-3xl font-black text-primary">
                {primaryResult.result_json?.overall?.toFixed(1)}{' '}
                <span className="text-sm font-normal text-muted-foreground">/ 5.0</span>
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Mapeamento Dimensional</CardTitle>
              <CardDescription>Visão geral de maturidade por área</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    A: { color: 'hsl(var(--primary))' },
                    B: { color: 'hsl(var(--muted-foreground))' },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'currentColor' }} />
                      <Radar
                        name="Atual"
                        dataKey="A"
                        stroke="var(--color-A)"
                        fill="var(--color-A)"
                        fillOpacity={0.6}
                      />
                      {compareResult && (
                        <Radar
                          name="Anterior"
                          dataKey="B"
                          stroke="var(--color-B)"
                          fill="var(--color-B)"
                          fillOpacity={0.3}
                        />
                      )}
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] mt-4">
              <ChartContainer
                config={{
                  A: { color: 'hsl(var(--primary))' },
                  B: { color: 'hsl(var(--muted-foreground))' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={radarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--muted))"
                    />
                    <XAxis
                      dataKey="subject"
                      tick={{ fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 5]}
                      tick={{ fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="A" fill="var(--color-A)" radius={[4, 4, 0, 0]} name="Atual" />
                    {compareResult && (
                      <Bar
                        dataKey="B"
                        fill="var(--color-B)"
                        radius={[4, 4, 0, 0]}
                        name="Anterior"
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
