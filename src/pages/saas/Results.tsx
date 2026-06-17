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
} from 'recharts'
import { Download, Printer, ArrowLeft, GitCompare, BookOpen, Trash2 } from 'lucide-react'
import { ChartContainer } from '@/components/ui/chart'
import { cn, exportToCSV } from '@/lib/utils'
import { checkIsAdmin } from '@/hooks/use-auth'
import { Textarea } from '@/components/ui/textarea'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export default function Results() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const resultId = searchParams.get('id')
  const { user } = useAuth()

  const [allResults, setAllResults] = useState<any[]>([])
  const [primaryResult, setPrimaryResult] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [compareResultId, setCompareResultId] = useState<string>('none')
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<any[]>([])

  const isAdmin = checkIsAdmin(user)
  const [consultantNotes, setConsultantNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useRealtime('v1_saas_results', (e) => {
    if (e.action === 'update') {
      setAllResults((prev) => prev.map((r) => (r.id === e.record.id ? { ...r, ...e.record } : r)))
      if (primaryResult?.id === e.record.id) {
        setPrimaryResult((prev: any) => ({ ...prev, ...e.record }))
        if (
          e.record.consultant_notes !== undefined &&
          document.activeElement?.id !== 'consultant_notes_textarea'
        ) {
          setConsultantNotes(e.record.consultant_notes)
        }
      }
    }
  })

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

        let main = null
        if (resultId) {
          main = res.find((r) => r.id === resultId)
          if (main) setPrimaryResult(main)
          else if (res.length > 0) {
            main = res[0]
            setPrimaryResult(res[0])
          }
        } else if (res.length > 0) {
          main = res[0]
          setPrimaryResult(res[0])
        }

        if (main && main.consultant_notes) {
          setConsultantNotes(main.consultant_notes)
        }

        if (main?.diagnostic) {
          const qs = await pb.collection('v1_saas_questions').getFullList({
            filter: `diagnostic="${main.diagnostic}"`,
          })
          setQuestions(qs)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [user.id, resultId])

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Gerando relatórios...
      </div>
    )
  if (!primaryResult)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhum resultado concluído encontrado para exibir.
      </div>
    )

  const compareResult =
    compareResultId !== 'none' ? allResults.find((r) => r.id === compareResultId) : null
  const scores = primaryResult.result_json?.scores || {}
  const compScores = compareResult?.result_json?.scores || {}

  const radarData = Object.keys(scores).map((key) => ({
    subject: key,
    Atual: scores[key],
    Esperado: 10,
    ...(compareResult ? { Comparação: compScores[key] || 0 } : {}),
  }))

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      await pb.collection('v1_saas_results').update(primaryResult.id, {
        consultant_notes: consultantNotes,
      })

      setPrimaryResult({ ...primaryResult, consultant_notes: consultantNotes })
    } catch (err) {
      console.error(err)
    }
    setSavingNotes(false)
  }

  const getClassificationColor = (c: string) => {
    switch (c) {
      case 'Excelência':
        return 'bg-[#1e3a8a]/10 text-[#1e3a8a] border-[#1e3a8a]/30'
      case 'Potencial':
        return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
      case 'Atenção':
        return 'bg-[#fde68a]/30 text-[#d97706] border-[#fde68a]'
      case 'Risco':
        return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'
      case 'Crise':
        return 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/50'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handlePrint = () => window.print()

  const handleExportCSV = () => {
    const answers = primaryResult.result_json?.answers || {}
    if (Object.keys(answers).length === 0 && questions.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum dado para exportar.' })
      return
    }
    const data = Object.entries(answers).map(([qId, score]) => {
      const q = questions.find((q) => q.id === qId)
      return {
        'Question ID': qId,
        'Question Text': q?.text || 'Desconhecida',
        'Category/Dimension': q?.dimension || 'Desconhecida',
        Score: score,
      }
    })
    exportToCSV(data, `resultado_${primaryResult.id}.csv`)
  }

  return (
    <>
      <style>{`
      @media print {
        @page { size: A4 portrait; margin: 15mm; }
        body { 
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: white !important; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
        .print\\:hidden { display: none !important; }
        .print\\:break-inside-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
        .print\\:break-before-page { page-break-before: always !important; }
        .page-break { page-break-before: always !important; }
      }
    `}</style>
      <div className="space-y-6 max-w-5xl mx-auto pb-12 px-4 print:p-0 print:m-0 print:max-w-none print:w-full">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <GitCompare className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={compareResultId} onValueChange={setCompareResultId}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Comparar com..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem comparação</SelectItem>
                  {allResults
                    .filter(
                      (r) =>
                        r.id !== primaryResult.id &&
                        r.expand?.diagnostic?.id === primaryResult.expand?.diagnostic?.id,
                    )
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {new Date(r.completed_at).toLocaleDateString()}{' '}
                        {r.result_json?.respondentLevel
                          ? `(${r.result_json?.respondentLevel})`
                          : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="w-full sm:w-auto shadow-md"
            >
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
            <Button
              onClick={handlePrint}
              className="w-full sm:w-auto bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 shadow-md"
            >
              <Printer className="h-4 w-4 mr-2" /> Exportar PDF
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto shadow-md"
              onClick={async () => {
                if (
                  confirm(
                    'Deseja realmente excluir este resultado? Esta ação não pode ser desfeita.',
                  )
                ) {
                  try {
                    await pb.collection('v1_saas_results').delete(primaryResult.id)
                    window.location.reload()
                  } catch (e) {
                    console.error(e)
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          </div>
        </div>

        <div className="print-area space-y-8 bg-white print:p-12 print:shadow-none shadow-sm rounded-xl p-6 md:p-8 border">
          <div className="hidden print:flex flex-col items-center justify-center min-h-[250mm] text-center border-b-8 border-[#1e3a8a] mb-12 pb-12 print:break-after-page">
            {settings?.logo ? (
              <img
                src={pb.files.getUrl(settings, settings.logo)}
                alt="Logo"
                className="h-40 mb-16 object-contain"
              />
            ) : (
              <div className="h-40 w-40 bg-[#1e3a8a]/10 rounded-full flex items-center justify-center mb-16">
                <BookOpen className="h-20 w-20 text-[#1e3a8a]" />
              </div>
            )}
            <h1 className="text-6xl font-black text-[#1e3a8a] mb-6 tracking-tight uppercase px-8">
              {primaryResult.expand?.diagnostic?.title}
            </h1>
            <p className="text-3xl text-gray-500 font-light mb-20">Relatório Executivo Oficial</p>

            <div className="bg-gray-50 w-full max-w-3xl p-10 rounded-3xl text-left border border-gray-100 shadow-sm">
              <p className="text-2xl mb-4">
                <strong className="text-gray-900">Cliente:</strong>{' '}
                {primaryResult.expand?.client?.name || user.name}
              </p>
              <p className="text-2xl mb-4">
                <strong className="text-gray-900">Data de Emissão:</strong>{' '}
                {new Date(primaryResult.completed_at).toLocaleDateString('pt-BR')}
              </p>
              {primaryResult.result_json?.respondentLevel && (
                <p className="text-2xl mb-4">
                  <strong className="text-gray-900">Nível do Respondente:</strong>{' '}
                  {primaryResult.result_json?.respondentLevel}
                </p>
              )}
              <p className="text-2xl">
                <strong className="text-gray-900">Score Global:</strong>{' '}
                {primaryResult.result_json?.overall?.toFixed(1)} / 10.0
              </p>
            </div>

            <div className="mt-auto pt-24 text-base text-gray-400 text-center w-full max-w-3xl">
              <div className="border-t-2 border-gray-200 pt-8 mt-8 flex flex-col gap-2 items-center">
                <span className="font-bold text-gray-600 text-xl">
                  {settings?.company_name || 'Skip Organizer'}
                </span>
                {settings?.contact_email && <span>Email: {settings.contact_email}</span>}
                {settings?.contact_phone && <span>Telefone: {settings.contact_phone}</span>}
                {settings?.report_comments && (
                  <span className="mt-4 text-sm italic max-w-xl leading-relaxed">
                    {settings.report_comments}
                  </span>
                )}
                <span className="mt-6 text-sm uppercase tracking-widest text-gray-300">
                  Gerado via Plataforma de Diagnósticos
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-8 mb-12 print:hidden bg-blue-50/50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-xl font-bold mb-4 text-[#1e3a8a]">
                Área do Consultor (Apenas Admin)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Escreva a análise qualitativa, plano de ação ou próximos passos que aparecerão no
                relatório final em PDF.
              </p>
              <Textarea
                id="consultant_notes_textarea"
                value={consultantNotes}
                onChange={(e) => setConsultantNotes(e.target.value)}
                rows={6}
                placeholder="Insira as considerações estratégicas..."
                className="bg-white"
              />
              <Button
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-4 bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90"
              >
                {savingNotes ? 'Salvando...' : 'Salvar Considerações'}
              </Button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 print:block print:w-full print:mt-0">
            <div className="md:col-span-1 print:mb-8 print:w-full print:break-inside-avoid">
              <Card className="bg-[#1e3a8a]/5 border-[#1e3a8a]/20 h-full print:border-none print:bg-transparent">
                <CardHeader className="text-center pb-2">
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
                  <p className="text-6xl font-black text-[#1e3a8a]">
                    {primaryResult.result_json?.overall?.toFixed(1)}{' '}
                    <span className="text-xl font-normal text-muted-foreground">/ 10</span>
                  </p>
                  {primaryResult.result_json?.respondentLevel && (
                    <p className="mt-4 text-sm font-semibold text-muted-foreground bg-white px-3 py-1 rounded-md border shadow-sm">
                      Visão: {primaryResult.result_json?.respondentLevel}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2 print:w-full print:break-inside-avoid">
              <Card className="shadow-none border-gray-200 h-full print:border-none print:bg-transparent">
                <CardHeader className="print:text-center">
                  <CardTitle>Mapeamento Dimensional</CardTitle>
                  <CardDescription>Visão geral de maturidade por área avaliada</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full print:h-[600px] print:w-[600px] print:mx-auto">
                    <ChartContainer
                      config={{
                        Esperado: { color: '#10b981' },
                        Atual: { color: '#1e3a8a' },
                        Comparação: { color: '#fde68a' },
                      }}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 10]}
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                          />
                          <Radar
                            name="Esperado"
                            dataKey="Esperado"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            fill="none"
                          />
                          <Radar
                            name="Atual"
                            dataKey="Atual"
                            stroke="#1e3a8a"
                            strokeWidth={3}
                            fill="#1e3a8a"
                            fillOpacity={0.4}
                          />
                          {compareResult && (
                            <Radar
                              name="Comparação"
                              dataKey="Comparação"
                              stroke="#fde68a"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              fill="#fde68a"
                              fillOpacity={0.4}
                            />
                          )}
                        </RadarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {consultantNotes && (
            <div className="print:break-before-page pt-8 border-t mt-12 mb-12">
              <h3 className="text-3xl font-bold mb-8 text-[#1e3a8a]">Considerações do Consultor</h3>
              <div className="bg-blue-50/30 p-10 rounded-2xl border border-blue-100 whitespace-pre-wrap text-gray-900 leading-relaxed text-xl shadow-sm">
                {consultantNotes}
              </div>
            </div>
          )}

          <div className="page-break pt-8 border-t mt-12">
            <h3 className="text-3xl font-bold mb-8 text-[#1e3a8a] print:text-center">
              Análise Qualitativa por Dimensão
            </h3>
            <div className="space-y-6">
              {Object.entries(scores).map(([dim, score]) => {
                const val = score as number
                const compVal = compScores[dim] as number
                const gap = compareResult ? (val - compVal).toFixed(1) : null
                return (
                  <div
                    key={dim}
                    className="print:break-inside-avoid bg-gray-50/80 rounded-xl p-5 md:p-8 border border-gray-200 hover:shadow-md transition-shadow mb-6"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 gap-2">
                      <div className="flex items-center flex-wrap gap-3">
                        <h4 className="text-lg md:text-xl font-bold text-gray-900">{dim}</h4>
                        {gap && (
                          <span
                            className={cn(
                              'text-xs md:text-sm font-bold px-2.5 py-1 rounded-md',
                              Number(gap) > 0
                                ? 'bg-green-100 text-green-700'
                                : Number(gap) < 0
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-200 text-gray-700',
                            )}
                          >
                            GAP: {Number(gap) > 0 ? '+' : ''}
                            {gap}
                          </span>
                        )}
                      </div>
                      <span className="text-lg md:text-xl font-black text-[#1e3a8a] bg-white px-3 py-1 rounded-lg shadow-sm border border-[#1e3a8a]/10 w-max">
                        {val.toFixed(1)}{' '}
                        <span className="text-sm font-normal text-muted-foreground">/ 10</span>
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base mt-2 mb-4">
                      {primaryResult.expand?.diagnostic?.type === 'strategic_360'
                        ? val >= 8
                          ? `A dimensão "${dim}" demonstra comportamentos sólidos e altamente alinhados às expectativas estratégicas. O avaliado possui forte aderência neste pilar.`
                          : val >= 5
                            ? `O desempenho em "${dim}" é razoável, indicando a necessidade de desenvolvimento de algumas competências específicas para alcançar maior impacto.`
                            : `A dimensão "${dim}" apresenta lacunas significativas de comportamento ou alinhamento. É recomendado um plano de desenvolvimento individual urgente.`
                        : primaryResult.expand?.diagnostic?.type === 'prisma'
                          ? val >= 8
                            ? `Os processos em "${dim}" são otimizados, refletindo maturidade organizacional e controle de riscos bem estabelecido.`
                            : val >= 5
                              ? `Em "${dim}", a organização apresenta níveis parciais de estruturação. Há espaço para padronização de procedimentos.`
                              : `A dimensão "${dim}" requer intervenção imediata, pois a ausência de processos estruturados expõe o negócio a riscos elevados.`
                          : val >= 8
                            ? `A dimensão "${dim}" apresenta alta maturidade e resultados excepcionais. O foco estratégico deve ser na inovação contínua.`
                            : val >= 5
                              ? `O desempenho em "${dim}" é intermediário. Um plano de ação focado em padronização trará ganhos expressivos.`
                              : `A área de "${dim}" encontra-se em um estado crítico. Faltam processos fundamentais, gerando possíveis riscos.`}
                    </p>

                    {/* Questões individuais desta dimensão */}
                    {questions.length > 0 && primaryResult.result_json?.answers && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        {questions
                          .filter((q) => (q.dimension || q.pilar) === dim)
                          .map((q) => (
                            <div key={q.id} className="flex justify-between items-start text-sm">
                              <span className="text-gray-600 pr-4">{q.text || q.text_full}</span>
                              <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                {primaryResult.result_json.answers[q.id] ?? '-'}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
