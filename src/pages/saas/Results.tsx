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
import { Download, ArrowLeft, GitCompare, BookOpen } from 'lucide-react'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export default function Results() {
  const [searchParams] = useSearchParams()
  const resultId = searchParams.get('id')
  const { user } = useAuth()

  const [allResults, setAllResults] = useState<any[]>([])
  const [primaryResult, setPrimaryResult] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [compareResultId, setCompareResultId] = useState<string>('none')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await pb.collection('v1_saas_results').getFullList({
          filter: `client = "${user.id}" && status = "Concluído"`,
          sort: '-completed_at',
          expand: 'diagnostic,client',
        })
        setAllResults(res)

        const sett = await pb.collection('v1_saas_settings').getList(1, 1)
        if (sett.items.length > 0) setSettings(sett.items[0])

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
        return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
      case 'Desenvolvimento':
        return 'bg-[#fde68a]/50 text-amber-800 border-[#fde68a]'
      case 'Risco':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:p-0 print:m-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <Button variant="ghost" asChild className="-ml-4 mb-2 text-muted-foreground">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Painel
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">
            Relatório de Diagnóstico
          </h2>
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
          <Button onClick={handlePrint} className="bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90">
            <Download className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="print-area space-y-8 bg-white print:p-12 print:shadow-none shadow-sm rounded-xl p-8 border">
        <div className="hidden print:flex flex-col items-center justify-center min-h-[90vh] text-center border-b-8 border-[#1e3a8a] mb-12">
          {settings?.logo ? (
            <img
              src={pb.files.getUrl(settings, settings.logo)}
              alt="Logo"
              className="h-32 mb-12 object-contain"
            />
          ) : (
            <div className="h-32 w-32 bg-[#1e3a8a]/10 rounded-full flex items-center justify-center mb-12">
              <BookOpen className="h-16 w-16 text-[#1e3a8a]" />
            </div>
          )}
          <h1 className="text-5xl font-black text-[#1e3a8a] mb-6 tracking-tight uppercase">
            {primaryResult.expand?.diagnostic?.title}
          </h1>
          <p className="text-2xl text-gray-500 font-light mb-16">Relatório Executivo Oficial</p>

          <div className="bg-gray-50 w-full max-w-2xl p-8 rounded-2xl text-left border border-gray-100">
            <p className="text-lg mb-2">
              <strong className="text-gray-900">Cliente:</strong>{' '}
              {primaryResult.expand?.client?.name || user.name}
            </p>
            <p className="text-lg mb-2">
              <strong className="text-gray-900">Data de Emissão:</strong>{' '}
              {new Date(primaryResult.completed_at).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-lg">
              <strong className="text-gray-900">Score Global:</strong>{' '}
              {primaryResult.result_json?.overall?.toFixed(1)} / 5.0
            </p>
          </div>
          <div className="mt-auto pb-12 text-sm text-gray-400">
            {settings?.company_name || 'Skip Organizer'} • Gerado via Plataforma
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 print:break-inside-avoid print:mt-12">
          <Card className="md:col-span-1 bg-[#1e3a8a]/5 border-[#1e3a8a]/20">
            <CardHeader>
              <CardTitle className="text-lg text-[#1e3a8a]">Classificação Final</CardTitle>
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
              <p className="text-5xl font-black text-[#1e3a8a]">
                {primaryResult.result_json?.overall?.toFixed(1)}{' '}
                <span className="text-lg font-normal text-muted-foreground">/ 5.0</span>
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-none border-gray-200">
            <CardHeader>
              <CardTitle>Mapeamento Dimensional</CardTitle>
              <CardDescription>Visão geral de maturidade por área</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer
                  config={{ A: { color: '#1e3a8a' }, B: { color: 'hsl(var(--muted-foreground))' } }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#9ca3af' }} />
                      <Radar
                        name="Atual"
                        dataKey="A"
                        stroke="#1e3a8a"
                        strokeWidth={3}
                        fill="#1e3a8a"
                        fillOpacity={0.4}
                      />
                      {compareResult && (
                        <Radar
                          name="Anterior"
                          dataKey="B"
                          stroke="#9ca3af"
                          fill="#9ca3af"
                          fillOpacity={0.2}
                        />
                      )}
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="print:break-inside-avoid pt-6 border-t mt-8">
          <h3 className="text-2xl font-bold mb-6 text-[#1e3a8a]">
            Plano de Ação e Feedback Qualitativo
          </h3>
          <div className="space-y-6">
            {Object.entries(scores).map(([dim, score]) => (
              <div key={dim} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xl font-bold text-gray-900">{dim}</h4>
                  <span className="text-lg font-bold text-[#1e3a8a]">
                    {(score as number).toFixed(1)} / 5.0
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {(score as number) >= 4
                    ? `A área de ${dim} apresenta alta maturidade, com práticas consolidadas. O foco deve ser na inovação contínua e compartilhamento de melhores práticas para manter a liderança.`
                    : (score as number) >= 2.5
                      ? `O desempenho em ${dim} é mediano. Há processos implementados, mas existem lacunas que impedem a escalabilidade plena. É recomendado um plano focado para padronizar e otimizar as entregas.`
                      : `A dimensão de ${dim} está em nível crítico. Necessita de atenção imediata e reestruturação de base para evitar riscos operacionais e financeiros iminentes aos resultados do negócio.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
