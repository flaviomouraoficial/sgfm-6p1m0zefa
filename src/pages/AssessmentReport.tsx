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
  CalendarDays,
  Link as LinkIcon,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAssessmentStore } from '@/stores/assessment'
import { useMainStore } from '@/stores/main'
import pb from '@/lib/pocketbase/client'
import { RadarChartComp } from '@/components/assessment/RadarChartComp'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

const getGoogleCalendarUrl = (title: string, start: Date, duration: number, details: string) => {
  const end = new Date(start.getTime() + duration * 60000)
  const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatTime(start)}/${formatTime(end)}&details=${encodeURIComponent(details)}`
}

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

  // Agendamento State
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '09:00',
    duration: 60,
    profissional_id: 'none',
    description: 'Feedback de Assessment Individual e elaboração de PDI.',
  })
  const [generatedLink, setGeneratedLink] = useState('')

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchRespostas(), fetchCalculos(), fetchQuestions()])
      try {
        const profs = await pb.collection('v1_profissionais').getFullList()
        setProfissionais(profs)
      } catch {
        /* intentionally ignored */
      }
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

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resposta || !scheduleData.date) return
    try {
      const startObj = new Date(`${scheduleData.date}T${scheduleData.time}:00`)
      const recordToSave = {
        data_horario: startObj.toISOString(),
        cliente_nome: resposta.nome_respondente,
        cliente_email: resposta.email_respondente,
        status: 'Agendado',
        profissional_id:
          scheduleData.profissional_id !== 'none' ? scheduleData.profissional_id : null,
      }
      await pb.collection('v1_agendamentos').create(recordToSave)

      const link = getGoogleCalendarUrl(
        `Devolutiva Assessment: ${resposta.nome_respondente}`,
        startObj,
        scheduleData.duration,
        scheduleData.description,
      )
      setGeneratedLink(link)
      toast({
        title: 'Agendamento Criado!',
        description: 'Você pode adicionar ao Google Calendar agora.',
      })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const availableHistory = useMemo(() => {
    if (!resposta) return []
    return respostas
      .filter((r) => r.email_respondente === resposta.email_respondente && r.id !== resposta.id)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }, [respostas, resposta?.email_respondente, resposta?.id])

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

    // For Line Chart
    const lineChartData: any[] = []

    relevantHistory.forEach((r) => {
      const calc = calculos.find((c) => c.resposta_id === r.id)
      if (calc) {
        const isCurrent = r.id === resposta.id
        const dateKey =
          new Date(r.created).toLocaleDateString('pt-BR') + (isCurrent ? ' (Atual)' : '')
        dataKeys.push(dateKey)

        chartData[0][dateKey] = calc.pilar_1_media || 0
        chartData[1][dateKey] = calc.pilar_2_media || 0
        chartData[2][dateKey] = calc.pilar_3_media || 0
        chartData[3][dateKey] = calc.pilar_4_media || 0
        chartData[4][dateKey] = calc.pilar_5_media || 0
        chartData[5][dateKey] = calc.pilar_6_media || 0
        chartData[6][dateKey] = calc.pilar_7_media || 0
        chartData[7][dateKey] = calc.pilar_8_media || 0
        chartData[8][dateKey] = calc.pilar_9_media || 0
        chartData[9][dateKey] = calc.mapeamento_agro_media || 0

        const sum =
          (calc.pilar_1_media || 0) +
          (calc.pilar_2_media || 0) +
          (calc.pilar_3_media || 0) +
          (calc.pilar_4_media || 0) +
          (calc.pilar_5_media || 0) +
          (calc.pilar_6_media || 0) +
          (calc.pilar_7_media || 0) +
          (calc.pilar_8_media || 0) +
          (calc.pilar_9_media || 0) +
          (calc.mapeamento_agro_media || 0)
        lineChartData.push({
          date: dateKey,
          MediaGeral: Number((sum / 10).toFixed(2)),
        })
      }
    })

    return { chartData, dataKeys, lineChartData }
  }, [availableHistory, selectedHistoryIds, resposta, calculos])

  const chartConfig = useMemo(() => {
    if (!historyData) return {}
    const config: any = {}
    const colors = [secondaryColor, '#94a3b8', '#cbd5e1', primaryColor]
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
    { subject: 'Maturidade', value: calculo.pilar_1_media || 0, fullMark: 5 },
    { subject: 'Competências', value: calculo.pilar_2_media || 0, fullMark: 5 },
    { subject: 'Inteligência Emocional', value: calculo.pilar_3_media || 0, fullMark: 5 },
    { subject: 'Visão Estratégica', value: calculo.pilar_4_media || 0, fullMark: 5 },
    { subject: 'Liderança', value: calculo.pilar_5_media || 0, fullMark: 5 },
    { subject: 'Integridade', value: calculo.pilar_6_media || 0, fullMark: 5 },
    { subject: 'Comunicação', value: calculo.pilar_7_media || 0, fullMark: 5 },
    { subject: 'Adaptabilidade', value: calculo.pilar_8_media || 0, fullMark: 5 },
    { subject: 'Rel. Familiar', value: calculo.pilar_9_media || 0, fullMark: 5 },
    { subject: 'Mapeamento Agro', value: calculo.mapeamento_agro_media || 0, fullMark: 5 },
  ]

  const automatedAlerts = []
  if ((calculo.pilar_4_media || 0) >= 4.0 && (calculo.pilar_8_media || 0) < 3.0) {
    automatedAlerts.push(
      'Alta Visão Estratégica vs Baixa Adaptabilidade: Ideias inovadoras, mas possível inflexibilidade.',
    )
  }
  if ((calculo.pilar_5_media || 0) >= 4.0 && (calculo.pilar_7_media || 0) < 3.0) {
    automatedAlerts.push(
      'Alta Liderança vs Baixa Comunicação: Liderança impositiva, com possíveis falhas no repasse.',
    )
  }
  if ((calculo.pilar_1_media || 0) >= 4.0 && (calculo.pilar_9_media || 0) < 3.0) {
    automatedAlerts.push(
      'Alta Maturidade vs Baixo Relac. Familiar: Autônomo na gestão, mas correndo risco de rupturas familiares.',
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
        return 'Sucessão Madura'
      case 'amarelo':
        return 'Atenção Necessária'
      case 'vermelho':
        return 'Risco Crítico'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 print-wrapper bg-white min-h-screen print:!bg-white print:!m-0 print:!p-0 print:!max-w-none">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          html, body, #root {
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
          }
          .overflow-hidden, .overflow-y-auto, .overflow-x-hidden, .h-screen, .max-h-screen {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          [data-sidebar="sidebar"], header, aside, nav, .no-print {
            display: none !important;
          }
          main, .flex-1, .w-full {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .print-wrapper {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print-content {
            padding-left: 0 !important;
            padding-right: 0 !important;
            max-width: 100% !important;
          }
          .break-before-page {
            page-break-before: always !important;
            break-before: page !important;
            padding-top: 1cm !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .shadow-sm {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
          .card-print-fix {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 320px !important;
            min-height: 320px !important;
          }
          .recharts-surface { overflow: visible !important; }
          h1 { font-size: 22pt !important; }
          h2 { font-size: 18pt !important; }
          h3 { font-size: 14pt !important; }
          p, span, div { line-height: 1.4; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="flex justify-between items-center mb-6 no-print px-8 pt-8">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setGeneratedLink('')
              setScheduleDialogOpen(true)
            }}
          >
            <CalendarDays className="w-4 h-4 mr-2" /> Agendar Devolutiva
          </Button>
          <Button
            onClick={async () => {
              if (editingNotes) await handleSaveNotes()

              // Trigger a resize event to ensure Recharts and other responsive components adapt to full width before printing
              window.dispatchEvent(new Event('resize'))

              setTimeout(() => {
                window.print()
              }, 500)
            }}
            style={{ backgroundColor: primaryColor }}
          >
            <Printer className="w-4 h-4 mr-2" /> Baixar PDF
          </Button>
        </div>
      </div>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Devolutiva de Assessment</DialogTitle>
            <DialogDescription>
              Marque uma sessão de feedback com o sucessor avaliado.
            </DialogDescription>
          </DialogHeader>
          {!generatedLink ? (
            <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Respondente</Label>
                <Input value={resposta.nome_respondente} disabled className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={scheduleData.date}
                    onChange={(e) => setScheduleData((s) => ({ ...s, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData((s) => ({ ...s, time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select
                  value={scheduleData.profissional_id}
                  onValueChange={(v) => setScheduleData((s) => ({ ...s, profissional_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum / Não Definido</SelectItem>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar e Gerar Link</Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h3 className="text-xl font-bold">Agendamento Confirmado!</h3>
              <p className="text-muted-foreground">
                O evento foi salvo no CRM. Clique no botão abaixo para adicionar a reunião na sua
                Agenda do Google e enviar o convite.
              </p>
              <a href={generatedLink} target="_blank" rel="noreferrer" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                  <CalendarDays className="w-4 h-4 mr-2" /> Adicionar ao Google Agenda
                </Button>
              </a>
              <Button
                variant="ghost"
                onClick={() => setScheduleDialogOpen(false)}
                className="w-full mt-2"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="px-8 print:px-0 print-content">
        <div className="flex justify-center mb-8 pb-6 border-b break-inside-avoid">
          {systemSettings?.logo ? (
            <img src={systemSettings.logo} alt="Logo" className="h-20 object-contain" />
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
                Grupo Flávio Moura
              </h2>
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

        <div className="grid grid-cols-2 gap-6 mb-8 break-inside-avoid">
          <Card
            className="shadow-sm border card-print-fix"
            style={{ borderColor: `${primaryColor}20` }}
          >
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
                <span className="text-slate-500 font-medium">Atua na Empresa:</span>{' '}
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
            className="shadow-sm flex flex-col justify-center items-center p-6 bg-slate-50 border card-print-fix"
            style={{ borderColor: `${primaryColor}20` }}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="uppercase text-xs font-bold text-slate-400 tracking-wider">
                Status Geral
              </span>
              {getStatusIcon(calculo.estado_sucessao)}
              <Badge
                className={`text-base px-4 py-1 font-bold text-white ${calculo.estado_sucessao === 'verde' ? 'bg-green-600 hover:bg-green-700' : calculo.estado_sucessao === 'amarelo' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {getStatusText(calculo.estado_sucessao)}
              </Badge>
            </div>
          </Card>
        </div>

        {automatedAlerts.length > 0 && (
          <Card className="mb-8 shadow-sm border-l-4 border-l-amber-500 bg-amber-50/30 card-print-fix break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" /> Alertas Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-amber-900">
                {automatedAlerts.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card
          className="mb-8 shadow-sm break-inside-avoid card-print-fix"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <CardTitle style={{ color: primaryColor }}>Mapeamento de Pilares</CardTitle>
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
                      className="font-bold text-sm"
                      style={{
                        color: d.value < 2.5 ? '#dc2626' : d.value < 4.0 ? '#eab308' : primaryColor,
                      }}
                    >
                      {d.value.toFixed(2)}{' '}
                      {d.value < 2.5 && (
                        <span className="ml-1 text-xs text-red-600 uppercase">(Crítico)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <History className="w-4 h-4" /> Diagnósticos Anteriores (Comparação)
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
                      <label htmlFor={`hist-${hist.id}`} className="text-sm font-medium">
                        {new Date(hist.created).toLocaleDateString('pt-BR')}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {historyData && (
              <div className="grid grid-cols-1 gap-6">
                <Card
                  className="shadow-sm card-print-fix break-inside-avoid"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" />
                    <CardTitle style={{ color: primaryColor }}>
                      Evolução por Pilar (Radar)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <RadarChart data={historyData.chartData}>
                        <PolarGrid />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#64748b', fontSize: 12 }}
                        />
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
                            fillOpacity={0.1}
                            isAnimationActive={false}
                          />
                        ))}
                      </RadarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card
                  className="shadow-sm break-inside-avoid card-print-fix"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" />
                    <CardTitle style={{ color: primaryColor }}>
                      Progresso Médio Global (Linha do Tempo)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[250px] w-full mt-4">
                      <ChartContainer
                        config={{ MediaGeral: { label: 'Média Global', color: primaryColor } }}
                        className="h-full w-full"
                      >
                        <LineChart
                          data={historyData.lineChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                          <RechartsTooltip />
                          <Line
                            type="monotone"
                            dataKey="MediaGeral"
                            stroke={primaryColor}
                            strokeWidth={3}
                            dot={{ r: 6, fill: primaryColor }}
                            activeDot={{ r: 8 }}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <div className="break-before-page">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2" style={{ color: primaryColor }}>
            Detalhamento das Respostas
          </h2>
          <div className="space-y-8">
            {radarData.map((d) => {
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
                <div key={pilarName} className="break-inside-avoid mb-6">
                  <div
                    className="bg-slate-50 p-4 rounded-md mb-4 border"
                    style={{ borderLeft: `4px solid ${d.value < 2.5 ? '#dc2626' : primaryColor}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {pilarName}
                        {d.value < 2.5 && (
                          <Badge variant="destructive" className="ml-2">
                            Crítico
                          </Badge>
                        )}
                      </h3>
                      <div
                        className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm border"
                        style={{ color: d.value < 2.5 ? '#dc2626' : primaryColor }}
                      >
                        Média: {d.value.toFixed(2)} / 5.00
                      </div>
                    </div>
                    <Progress
                      value={(d.value / 5) * 100}
                      className="h-2 bg-slate-200"
                      indicatorColor={
                        d.value < 2.5 ? '#dc2626' : d.value < 4.0 ? '#eab308' : primaryColor
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    {qs.map((q) => (
                      <div
                        key={q.id}
                        className="flex justify-between text-sm p-2 border-b border-slate-50 last:border-0"
                      >
                        <span className="text-slate-600 max-w-[85%]">{q.text_full}</span>
                        <span className="font-semibold">
                          {resposta.respostas_json?.[`q${q.order}`] || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="break-before-page pt-8 pb-10">
          <Card
            className="shadow-sm break-inside-avoid border-2 card-print-fix"
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
                    {notesData.observacoes_gerais || 'Nenhuma observação.'}
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
                <h4 className="font-bold text-sm text-red-700 mb-2 uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Riscos e Bandeiras Vermelhas
                </h4>
                {radarData.filter((d) => d.value < 2.5).length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="font-bold text-red-800 text-xs mb-2 uppercase tracking-wider">
                      Pilares Críticos (&lt; 2.5)
                    </p>
                    <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                      {radarData
                        .filter((d) => d.value < 2.5)
                        .map((p) => (
                          <li key={p.subject}>
                            <span className="font-semibold">{p.subject}</span>: {p.value.toFixed(2)}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
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
                    {notesData.bandeiras_vermelhas || 'Nenhuma nota adicional.'}
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
