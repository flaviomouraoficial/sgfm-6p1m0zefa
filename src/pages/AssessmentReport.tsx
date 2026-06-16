import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Printer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  History,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useAssessmentStore } from '@/stores/assessment'
import { useMainStore } from '@/stores/main'
import { RadarChartComp } from '@/components/assessment/RadarChartComp'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

export default function AssessmentReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { systemSettings } = useMainStore()
  const {
    respostas,
    calculos,
    questions,
    fetchRespostas,
    fetchCalculos,
    fetchQuestions,
    updateCalculo,
  } = useAssessmentStore()

  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesData, setNotesData] = useState({
    observacoes_gerais: '',
    padroes_identificados: '',
    inconsistencias: '',
    bandeiras_vermelhas: '',
  })

  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchRespostas(), fetchCalculos(), fetchQuestions()])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (calculos.length > 0 && id) {
      const calc = calculos.find((c) => c.resposta_id === id)
      if (calc?.consultant_notes) {
        setNotesData({
          observacoes_gerais: calc.consultant_notes.observacoes_gerais || '',
          padroes_identificados: calc.consultant_notes.padroes_identificados || '',
          inconsistencias: calc.consultant_notes.inconsistencias || '',
          bandeiras_vermelhas: calc.consultant_notes.bandeiras_vermelhas || '',
        })
      }
    }
  }, [calculos, id])

  const handleSaveNotes = async () => {
    const calc = calculos.find((c) => c.resposta_id === id)
    if (calc) {
      await updateCalculo(calc.id, { consultant_notes: notesData })
      setEditingNotes(false)
      toast({ title: 'Anotações salvas com sucesso!' })
    }
  }

  const resposta = respostas.find((r) => r.id === id)
  const calculo = calculos.find((c) => c.resposta_id === id)

  const primaryColor = systemSettings?.primaryColor || '#4f46e5'
  const secondaryColor = systemSettings?.secondaryColor || '#eab308'

  // Base available history (all except current)
  const availableHistory = useMemo(() => {
    if (!resposta) return []
    return respostas
      .filter((r) => r.email_respondente === resposta.email_respondente && r.id !== resposta.id)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }, [respostas, resposta?.email_respondente, resposta?.id])

  // Initialize selected history with up to 2 latest past assessments
  useEffect(() => {
    if (availableHistory.length > 0 && selectedHistoryIds.length === 0 && !loading) {
      setSelectedHistoryIds(availableHistory.slice(0, 2).map((r) => r.id))
    }
  }, [availableHistory, loading, selectedHistoryIds.length])

  const toggleHistorySelection = (histId: string) => {
    setSelectedHistoryIds((prev) =>
      prev.includes(histId) ? prev.filter((id) => id !== histId) : [...prev, histId],
    )
  }

  // Historic Data Calculation based on selected ones + current
  const historyData = useMemo(() => {
    if (selectedHistoryIds.length === 0 || !resposta) return null

    const selectedPast = availableHistory
      .filter((r) => selectedHistoryIds.includes(r.id))
      .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

    const relevantHistory = [...selectedPast, resposta]

    const chartData = [
      { subject: 'Maturidade' },
      { subject: 'Competências' },
      { subject: 'Intel. Emocional' },
      { subject: 'Visão Estratégica' },
      { subject: 'Liderança' },
      { subject: 'Integridade' },
      { subject: 'Comunicação' },
      { subject: 'Adaptabilidade' },
      { subject: 'Rel. Familiar' },
      { subject: 'Map. Agro' },
    ] as any[]

    const dataKeys: string[] = []

    relevantHistory.forEach((r) => {
      const calc = calculos.find((c) => c.resposta_id === r.id)
      if (calc) {
        // Distinguish the current report date clearly
        const isCurrent = r.id === resposta.id
        const dateKey =
          new Date(r.created).toLocaleDateString('pt-BR') + (isCurrent ? ' (Atual)' : '')
        dataKeys.push(dateKey)
        chartData[0][dateKey] = calc.pilar_1_media
        chartData[1][dateKey] = calc.pilar_2_media
        chartData[2][dateKey] = calc.pilar_3_media
        chartData[3][dateKey] = calc.pilar_4_media
        chartData[4][dateKey] = calc.pilar_5_media
        chartData[5][dateKey] = calc.pilar_6_media
        chartData[6][dateKey] = calc.pilar_7_media
        chartData[7][dateKey] = calc.pilar_8_media
        chartData[8][dateKey] = calc.pilar_9_media
        chartData[9][dateKey] = calc.mapeamento_agro_media
      }
    })

    return { chartData, dataKeys }
  }, [availableHistory, selectedHistoryIds, resposta, calculos])

  const chartConfig = useMemo(() => {
    if (!historyData) return {}
    const config: any = {}
    const colors = [secondaryColor, '#94a3b8', '#cbd5e1', primaryColor]
    // current is usually the last one, so it gets primaryColor if there are up to 3 past ones
    historyData.dataKeys.forEach((key, idx) => {
      const isCurrent = key.includes('(Atual)')
      config[key] = {
        label: key,
        color: isCurrent ? primaryColor : colors[idx % (colors.length - 1)],
      }
    })
    return config
  }, [historyData, primaryColor, secondaryColor])

  if (loading) return <div className="p-8 text-center">Carregando relatório...</div>

  if (!resposta || !calculo) {
    return <div className="p-8 text-center text-red-500">Relatório não encontrado.</div>
  }

  const radarData = [
    { subject: 'Maturidade', value: calculo.pilar_1_media, fullMark: 5 },
    { subject: 'Competências', value: calculo.pilar_2_media, fullMark: 5 },
    { subject: 'Inteligência Emocional', value: calculo.pilar_3_media, fullMark: 5 },
    { subject: 'Visão Estratégica', value: calculo.pilar_4_media, fullMark: 5 },
    { subject: 'Liderança', value: calculo.pilar_5_media, fullMark: 5 },
    { subject: 'Integridade', value: calculo.pilar_6_media, fullMark: 5 },
    { subject: 'Comunicação', value: calculo.pilar_7_media, fullMark: 5 },
    { subject: 'Adaptabilidade', value: calculo.pilar_8_media, fullMark: 5 },
    { subject: 'Rel. Familiar', value: calculo.pilar_9_media, fullMark: 5 },
    { subject: 'Mapeamento Agro', value: calculo.mapeamento_agro_media, fullMark: 5 },
  ]

  const automatedAlerts = []
  if (calculo.pilar_4_media >= 4.0 && calculo.pilar_8_media < 3.0) {
    automatedAlerts.push(
      'Alta Visão Estratégica vs Baixa Adaptabilidade: Ideias inovadoras, mas possível inflexibilidade na implementação e rotina.',
    )
  }
  if (calculo.pilar_5_media >= 4.0 && calculo.pilar_7_media < 3.0) {
    automatedAlerts.push(
      'Alta Liderança vs Baixa Comunicação: Liderança centralizadora ou impositiva, com possíveis falhas no repasse de informações.',
    )
  }
  if (calculo.pilar_1_media >= 4.0 && calculo.pilar_9_media < 3.0) {
    automatedAlerts.push(
      'Alta Maturidade Executiva vs Baixo Relac. Familiar: Autônomo na gestão, mas correndo risco de causar rupturas com o fundador e família.',
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verde':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'amarelo':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />
      case 'vermelho':
        return <XCircle className="w-8 h-8 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verde':
        return 'Sucessão Madura (Verde)'
      case 'amarelo':
        return 'Atenção Necessária (Amarelo)'
      case 'vermelho':
        return 'Risco Crítico (Vermelho)'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 print-wrapper bg-white min-h-screen print:!bg-white print:!m-0 print:!p-0 print:!max-w-none">
      <style>{`
        @media print {
          @page { margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .print-wrapper { width: 100% !important; max-w: none !important; }
          .no-print { display: none !important; }
          .break-before-page { page-break-before: always; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
      <div className="flex justify-between items-center mb-6 no-print px-8 pt-8">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button onClick={() => window.print()} style={{ backgroundColor: primaryColor }}>
          <Printer className="w-4 h-4 mr-2" /> Baixar Relatório em PDF
        </Button>
      </div>

      <div className="px-8 print-content">
        {/* BRANDING HEADER */}
        <div className="flex justify-center mb-8 pb-6 border-b">
          {systemSettings?.logo ? (
            <img
              src={systemSettings.logo}
              alt="Logo Grupo Flávio Moura"
              className="h-20 object-contain"
            />
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
                Grupo Flávio Moura
              </h2>
              <p className="text-sm text-slate-500 uppercase tracking-widest">Trend Consultoria</p>
            </div>
          )}
        </div>

        <div className="text-center mb-8" style={{ color: primaryColor }}>
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            Relatório Individual de Sucessão
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {resposta.expand?.cliente_id?.name || 'Cliente'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm border" style={{ borderColor: `${primaryColor}20` }}>
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-lg" style={{ color: primaryColor }}>
                Dados do Respondente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Nome:</span>{' '}
                <span className="col-span-2 font-semibold">{resposta.nome_respondente}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Email:</span>{' '}
                <span className="col-span-2">{resposta.email_respondente}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Vínculo:</span>{' '}
                <span className="col-span-2 capitalize">{resposta.grau_parentesco}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Atua na Org:</span>{' '}
                <span className="col-span-2">{resposta.atua_na_organizacao ? 'Sim' : 'Não'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-medium">Data:</span>{' '}
                <span className="col-span-2">
                  {new Date(resposta.created).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="shadow-sm flex flex-col justify-center items-center p-6 bg-slate-50"
            style={{ borderColor: `${primaryColor}20` }}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="uppercase text-xs font-bold text-slate-400 tracking-wider">
                Status Geral da Sucessão
              </span>
              {getStatusIcon(calculo.estado_sucessao)}
              <span
                className={`text-xl font-bold ${calculo.estado_sucessao === 'verde' ? 'text-green-600' : calculo.estado_sucessao === 'amarelo' ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {getStatusText(calculo.estado_sucessao)}
              </span>
            </div>
          </Card>
        </div>

        {automatedAlerts.length > 0 && (
          <Card className="mb-8 shadow-sm border-l-4 border-l-amber-500 bg-amber-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" /> Alertas Automáticos de Inconsistência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-amber-900">
                {automatedAlerts.map((alert, i) => (
                  <li key={i}>{alert}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card
          className="mb-8 shadow-sm break-inside-avoid"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <CardTitle style={{ color: primaryColor }}>
              Mapeamento de Pilares (Resultado Atual)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <RadarChartComp data={radarData} color={primaryColor} />
              </div>
              <div className="space-y-3">
                {radarData.map((d) => (
                  <div
                    key={d.subject}
                    className="flex justify-between items-center border-b border-dashed pb-2 last:border-0"
                  >
                    <span className="text-sm font-medium text-slate-700">{d.subject}</span>
                    <span
                      className={`font-bold text-sm`}
                      style={{
                        color: d.value < 2.5 ? '#dc2626' : d.value < 4.0 ? '#eab308' : primaryColor,
                      }}
                    >
                      {d.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COMPARISON HISTORY CHART & SELECTION */}
        {availableHistory.length > 0 && (
          <div className="mb-8 break-inside-avoid space-y-4">
            <Card
              className="shadow-sm border no-print"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <CardHeader className="pb-3 bg-slate-50/50">
                <CardTitle
                  className="text-md flex items-center gap-2"
                  style={{ color: primaryColor }}
                >
                  <History className="w-4 h-4" /> Diagnósticos Anteriores (Selecione para comparar)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4">
                  {availableHistory.map((hist) => (
                    <div key={hist.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hist-${hist.id}`}
                        checked={selectedHistoryIds.includes(hist.id)}
                        onCheckedChange={() => toggleHistorySelection(hist.id)}
                      />
                      <label
                        htmlFor={`hist-${hist.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {new Date(hist.created).toLocaleDateString('pt-BR')}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {historyData && (
              <Card className="shadow-sm" style={{ borderColor: `${primaryColor}20` }}>
                <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-500" />
                  <CardTitle style={{ color: primaryColor }}>
                    Histórico e Evolução do Respondente
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <RadarChart data={historyData.chartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      {historyData.dataKeys.map((key) => (
                        <Radar
                          key={key}
                          name={key}
                          dataKey={key}
                          stroke={chartConfig[key].color}
                          fill={chartConfig[key].color}
                          fillOpacity={0.3}
                        />
                      ))}
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="break-before-page">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2" style={{ color: primaryColor }}>
            Detalhamento das Respostas
          </h2>
          <div className="space-y-8">
            {radarData.map((d, i) => {
              const pilarName =
                d.subject === 'Map. Agro'
                  ? 'Mapeamento Agro'
                  : d.subject === 'Intel. Emocional'
                    ? 'Inteligência Emocional'
                    : d.subject === 'Rel. Familiar'
                      ? 'Relacionamento Familiar'
                      : d.subject
              const qs = questions.filter((q) => q.pilar === pilarName)
              if (qs.length === 0) return null

              return (
                <div key={pilarName} className="break-inside-avoid">
                  <div
                    className="flex items-center justify-between bg-slate-100 p-3 rounded-md mb-3"
                    style={{ borderLeft: `4px solid ${primaryColor}` }}
                  >
                    <h3 className="font-bold text-lg">{pilarName}</h3>
                    <div
                      className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm"
                      style={{ color: primaryColor }}
                    >
                      Média: {d.value.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {qs.map((q) => {
                      const v = resposta.respostas_json[`q${q.order}`]
                      return (
                        <div
                          key={q.id}
                          className="flex justify-between text-sm p-2 border-b border-slate-50 last:border-0"
                        >
                          <span className="text-slate-600 max-w-[85%]">{q.text_full}</span>
                          <span className="font-semibold">{v}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CONSULTANT NOTES - AT THE END OF THE PDF */}
        <div className="break-before-page pt-8 pb-10">
          <Card
            className="shadow-sm break-inside-avoid border-2"
            style={{ borderColor: primaryColor }}
          >
            <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row justify-between items-center">
              <div>
                <CardTitle style={{ color: primaryColor }}>Considerações do Consultor</CardTitle>
                <CardDescription>
                  Notas técnicas e qualitativas anexadas a este relatório.
                </CardDescription>
              </div>
              <div className="no-print">
                {editingNotes ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setEditingNotes(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveNotes} style={{ backgroundColor: primaryColor }}>
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setEditingNotes(true)}>
                    Editar Notas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">
                  Observações Gerais
                </h4>
                {editingNotes ? (
                  <Textarea
                    value={notesData.observacoes_gerais}
                    onChange={(e) =>
                      setNotesData({ ...notesData, observacoes_gerais: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {notesData.observacoes_gerais || 'Nenhuma observação registrada.'}
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">
                  Padrões Identificados
                </h4>
                {editingNotes ? (
                  <Textarea
                    value={notesData.padroes_identificados}
                    onChange={(e) =>
                      setNotesData({ ...notesData, padroes_identificados: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {notesData.padroes_identificados || '-'}
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">
                  Inconsistências (Análise Humana)
                </h4>
                {editingNotes ? (
                  <Textarea
                    value={notesData.inconsistencias}
                    onChange={(e) =>
                      setNotesData({ ...notesData, inconsistencias: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {notesData.inconsistencias || '-'}
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-red-700 mb-2 uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Bandeiras Vermelhas
                </h4>
                {editingNotes ? (
                  <Textarea
                    value={notesData.bandeiras_vermelhas}
                    onChange={(e) =>
                      setNotesData({ ...notesData, bandeiras_vermelhas: e.target.value })
                    }
                    rows={3}
                    className="border-red-200"
                  />
                ) : (
                  <p className="text-sm text-red-600 whitespace-pre-wrap">
                    {notesData.bandeiras_vermelhas || 'Nenhum risco crítico sinalizado.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
