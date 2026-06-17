import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Printer, Save, Link as LinkIcon, RefreshCw, Copy, Download } from 'lucide-react'
import { exportToCSV } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export default function AssessmentReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [result, setResult] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [links, setLinks] = useState<any[]>([])
  const [generatingLinks, setGeneratingLinks] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [notFound, setNotFound] = useState(false)

  const [quotaEstrategico, setQuotaEstrategico] = useState(5)
  const [quotaTatico, setQuotaTatico] = useState(10)
  const [quotaOperacional, setQuotaOperacional] = useState(20)

  const is360 =
    result?.type === 'strategic_360' || result?.expand?.diagnostic?.type === 'strategic_360'

  useRealtime('v1_saas_results', (e) => {
    if (e.record.id === id && e.action === 'update') {
      setResult((prev: any) => ({ ...prev, ...e.record, expand: prev?.expand }))
      if (
        e.record.consultant_notes !== undefined &&
        document.activeElement?.id !== 'consultant_notes_textarea'
      ) {
        setNotes(e.record.consultant_notes)
      }
    }
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await pb.collection('v1_saas_results').getOne(id!, {
          expand: 'client,diagnostic',
        })
        setResult(res)
        setNotes(res.consultant_notes || '')

        if (res.expand?.diagnostic) {
          setQuotaEstrategico(res.expand.diagnostic.limit_strategic || 5)
          setQuotaTatico(res.expand.diagnostic.limit_tactical || 10)
          setQuotaOperacional(res.expand.diagnostic.limit_operational || 20)
        }

        const sets = await pb.collection('v1_saas_settings').getList(1, 1)
        if (sets.items.length > 0) setSettings(sets.items[0])

        if (res.type === 'strategic_360' || res.expand?.diagnostic?.type === 'strategic_360') {
          const lks = await pb.collection('v1_assessment_links').getFullList({
            filter: `result_id="${id}"`,
          })
          setLinks(lks)
        }

        if (res.diagnostic) {
          const qs = await pb.collection('v1_saas_questions').getFullList({
            filter: `diagnostic="${res.diagnostic}"`,
          })
          setQuestions(qs)
        }
      } catch (err: any) {
        if (err.status === 404) {
          setNotFound(true)
        } else {
          toast({
            title: 'Erro',
            description: 'Falha ao carregar relatório.',
            variant: 'destructive',
          })
        }
      }
    }
    if (id) load()
  }, [id, toast])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await pb.collection('v1_saas_results').update(id!, { consultant_notes: notes })
      toast({ title: 'Sucesso', description: 'Considerações salvas.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setSavingNotes(false)
    }
  }

  const handleGenerateLinks = async () => {
    setGeneratingLinks(true)
    try {
      const quotas = {
        estrategico: quotaEstrategico,
        tatico: quotaTatico,
        operacional: quotaOperacional,
      }
      const res = await pb.send('/backend/v1/saas/360-links', {
        method: 'POST',
        body: JSON.stringify({ result_id: id, quotas }),
      })
      setLinks(res.links)
      toast({ title: 'Links Gerados', description: 'Os links 360° foram criados/atualizados.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setGeneratingLinks(false)
    }
  }

  const copyToClipboard = (url: string) => {
    const fullUrl = `${window.location.origin}/assessment/${url}`
    navigator.clipboard.writeText(fullUrl)
    toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência.' })
  }

  if (notFound)
    return (
      <div className="p-8 text-center text-muted-foreground font-semibold text-lg">
        Resultado não encontrado ou indisponível.
      </div>
    )

  if (!result)
    return <div className="p-8 text-center text-muted-foreground">Carregando relatório...</div>

  // Parse result_json.answers
  const answers = result.result_json?.answers || {}
  const scoresByDimension: Record<string, { total: number; count: number }> = {}

  if (Object.keys(answers).length > 0 && questions.length > 0) {
    Object.entries(answers).forEach(([qId, score]) => {
      const q = questions.find((q) => q.id === qId)
      const dim = q?.dimension || 'Outros'
      if (!scoresByDimension[dim]) scoresByDimension[dim] = { total: 0, count: 0 }
      scoresByDimension[dim].total += Number(score)
      scoresByDimension[dim].count += 1
    })
  }

  // Pre-calculated scores might exist in result_json.scores
  const precalcScores = result.result_json?.scores || {}

  const finalScores =
    Object.keys(scoresByDimension).length > 0
      ? Object.entries(scoresByDimension).map(([dim, data]) => ({
          subject: dim,
          A: data.total / data.count,
          fullMark: 10,
        }))
      : Object.entries(precalcScores).map(([dim, score]) => ({
          subject: dim,
          A: Number(score),
          fullMark: 10,
        }))

  const chartData =
    finalScores.length > 0 ? finalScores : [{ subject: 'Dados Indisponíveis', A: 0, fullMark: 10 }]

  const handleExportCSV = () => {
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
    exportToCSV(data, `resultado_${id}.csv`)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> Exportar Dados (CSV)
          </Button>
          <Button onClick={() => window.print()} className="bg-primary text-primary-foreground">
            <Printer className="w-4 h-4 mr-2" /> Exportar PDF A4
          </Button>
        </div>
      </div>

      {/* Admin Interface (Hidden in Print) */}
      <div className="grid gap-6 print:hidden">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-xl">Considerações do Consultor</CardTitle>
            <CardDescription>
              Adicione sua análise técnica. Este texto aparecerá na última página do PDF gerado.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Textarea
              id="consultant_notes_textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite aqui suas considerações..."
              className="min-h-[200px] text-base resize-y"
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Considerações
              </Button>
            </div>
          </CardContent>
        </Card>

        {is360 && (
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-blue-900">
                    Gerenciamento de Links 360°
                  </CardTitle>
                  <CardDescription className="text-blue-700/70">
                    Links únicos para distribuição da pesquisa (Estratégico, Tático, Operacional).
                  </CardDescription>
                </div>
                <Button
                  onClick={handleGenerateLinks}
                  disabled={generatingLinks}
                  variant="outline"
                  className="bg-white"
                >
                  <LinkIcon className="w-4 h-4 mr-2" /> Gerar / Atualizar Links
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border rounded-lg">
                <div className="space-y-2">
                  <Label>Vagas Estratégico</Label>
                  <Input
                    type="number"
                    min="0"
                    value={quotaEstrategico}
                    onChange={(e) => setQuotaEstrategico(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vagas Tático</Label>
                  <Input
                    type="number"
                    min="0"
                    value={quotaTatico}
                    onChange={(e) => setQuotaTatico(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vagas Operacional</Label>
                  <Input
                    type="number"
                    min="0"
                    value={quotaOperacional}
                    onChange={(e) => setQuotaOperacional(Number(e.target.value))}
                  />
                </div>
              </div>

              {links.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum link gerado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {links.map((l: any) => (
                    <div
                      key={l.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-slate-50 gap-4"
                    >
                      <div>
                        <p className="font-bold uppercase text-sm tracking-wider text-slate-800">
                          {l.type || l.link_type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Limite: {l.quota || l.quantidade_permitida} | Usos:{' '}
                          {l.used || l.quantidade_usada}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <code className="text-xs bg-white px-2 py-1 border rounded truncate max-w-[200px]">
                          .../assessment/{l.url || l.link_unico}
                        </code>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyToClipboard(l.url || l.link_unico)}
                          className="shrink-0"
                        >
                          <Copy className="w-4 h-4 mr-2" /> Copiar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* --- A4 Print View --- */}
      <div
        className="bg-white p-0 md:p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 w-full"
        id="print-area"
      >
        <style>{`
          @media print {
            body { font-family: sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4; margin: 15mm; }
            .print\\:hidden { display: none !important; }
            .page-break { page-break-before: always; }
          }
        `}</style>

        {/* Page 1: Cover & Summary */}
        <div className="min-h-[297mm] w-full bg-white relative flex flex-col pb-12">
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-[#1e3a8a] pb-6 mb-8">
            {settings?.logo ? (
              <img
                src={pb.files.getUrl(settings, settings.logo)}
                alt="Logo"
                className="h-16 object-contain"
              />
            ) : (
              <h2 className="text-2xl font-black text-[#1e3a8a]">
                {settings?.company_name || 'Skip Organizer'}
              </h2>
            )}
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">
                {settings?.report_title || 'Relatório Diagnóstico'}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {result?.expand?.diagnostic?.title || 'Avaliação'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10 bg-slate-50 p-6 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Cliente
              </p>
              <p className="text-lg font-semibold text-slate-800">
                {result?.expand?.client?.name || result?.expand?.client?.email || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Data de Conclusão
              </p>
              <p className="text-lg font-semibold text-slate-800">
                {result?.completed_at
                  ? new Date(result.completed_at).toLocaleDateString('pt-BR')
                  : 'Pendente'}
              </p>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#10b981] rounded-full inline-block"></span>
              Resumo Executivo (Visão Geral)
            </h3>
            <div className="h-[400px] w-full print:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Radar
                    name="Pontuação"
                    dataKey="A"
                    stroke="#1e3a8a"
                    fill="#1e3a8a"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer (repeated on pages) */}
          <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-500">
            <p>{settings?.contact_email || 'contato@empresa.com'}</p>
            <p>{settings?.contact_phone || '(00) 0000-0000'}</p>
          </div>
        </div>

        {/* Page 2: Question Breakdown */}
        <div className="page-break min-h-[297mm] w-full bg-white relative flex flex-col pt-8">
          <h3 className="text-xl font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-[#1e3a8a] rounded-full inline-block"></span>
            Detalhamento por Questão
          </h3>

          <div className="flex-1 bg-white">
            {Object.keys(answers).length > 0 && questions.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(
                  questions.reduce(
                    (acc, q) => {
                      const dim = q.dimension || q.pilar || 'Outros'
                      if (!acc[dim]) acc[dim] = []
                      acc[dim].push(q)
                      return acc
                    },
                    {} as Record<string, any[]>,
                  ),
                ).map(([dim, qs]) => (
                  <div key={dim} className="mb-6 break-inside-avoid print:break-inside-avoid">
                    <h4 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2">{dim}</h4>
                    <ul className="space-y-2">
                      {qs.map((q) => (
                        <li
                          key={q.id}
                          className="flex justify-between items-start p-3 bg-slate-50 rounded-lg border border-slate-100"
                        >
                          <span className="text-sm text-slate-700 pr-4">
                            {q.text || q.text_full}
                          </span>
                          <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border whitespace-nowrap">
                            Nota: {answers[q.id] ?? '-'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center text-slate-400 italic h-40">
                Respostas detalhadas não disponíveis.
              </div>
            )}
          </div>

          <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-500">
            <p>{settings?.contact_email || 'contato@empresa.com'}</p>
            <p>{settings?.contact_phone || '(00) 0000-0000'}</p>
          </div>
        </div>

        {/* Page 3: Details & Consultant Notes */}
        <div className="page-break min-h-[297mm] w-full bg-white relative flex flex-col pt-8">
          <h3 className="text-xl font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-[#1e3a8a] rounded-full inline-block"></span>
            Considerações do Consultor Especialista
          </h3>

          <div className="flex-1 bg-slate-50 p-8 rounded-xl border border-slate-200">
            {notes ? (
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-justify">
                {notes}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Nenhuma consideração adicional foi inserida pelo consultor.
              </div>
            )}
          </div>

          {/* Signature Line */}
          <div className="mt-20 mb-12 flex justify-end">
            <div className="text-center w-64 border-t border-slate-400 pt-3">
              <p className="font-bold text-slate-800">Consultor Responsável</p>
              <p className="text-sm text-slate-500">{settings?.company_name}</p>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-500">
            <p>{settings?.contact_email || 'contato@empresa.com'}</p>
            <p>{settings?.contact_phone || '(00) 0000-0000'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
