import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useAssessmentStore } from '@/stores/assessment'
import { RadarChartComp } from '@/components/assessment/RadarChartComp'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export default function AssessmentReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
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

  if (loading) return <div className="p-8 text-center">Carregando relatório...</div>

  const resposta = respostas.find((r) => r.id === id)
  const calculo = calculos.find((c) => c.resposta_id === id)

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
    <div className="max-w-5xl mx-auto pb-12 print-wrapper bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6 no-print px-8 pt-8">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="px-8 print-content">
        <div className="text-center border-b pb-6 mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-900">
            Relatório Individual de Sucessão
          </h1>
          <p className="text-slate-500 mt-2">{resposta.expand?.cliente_id?.name || 'Cliente'}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-lg">Dados do Respondente</CardTitle>
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

          <Card className="shadow-sm flex flex-col justify-center items-center p-6 bg-slate-50">
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

        <Card className="mb-8 shadow-sm break-inside-avoid">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <CardTitle>Mapeamento de Pilares</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <RadarChartComp
                  data={radarData}
                  color={
                    calculo.estado_sucessao === 'verde'
                      ? '#16a34a'
                      : calculo.estado_sucessao === 'amarelo'
                        ? '#eab308'
                        : '#dc2626'
                  }
                />
              </div>
              <div className="space-y-3">
                {radarData.map((d) => (
                  <div
                    key={d.subject}
                    className="flex justify-between items-center border-b border-dashed pb-2 last:border-0"
                  >
                    <span className="text-sm font-medium text-slate-700">{d.subject}</span>
                    <span
                      className={`font-bold text-sm ${d.value < 2.5 ? 'text-red-600' : d.value < 4.0 ? 'text-yellow-600' : 'text-green-600'}`}
                    >
                      {d.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-sm break-inside-avoid">
          <CardHeader className="border-b bg-slate-50/50 pb-4 flex flex-row justify-between items-center">
            <div>
              <CardTitle>Considerações do Consultor</CardTitle>
              <CardDescription>Notas técnicas e qualitativas sobre o sucessor.</CardDescription>
            </div>
            <div className="no-print">
              {editingNotes ? (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setEditingNotes(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveNotes}>Salvar</Button>
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
                  onChange={(e) => setNotesData({ ...notesData, inconsistencias: e.target.value })}
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

        <div className="break-before-page">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">Detalhamento das Respostas</h2>
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
                  <div className="flex items-center justify-between bg-slate-100 p-3 rounded-md mb-3">
                    <h3 className="font-bold text-lg">{pilarName}</h3>
                    <div className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
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
      </div>
    </div>
  )
}
