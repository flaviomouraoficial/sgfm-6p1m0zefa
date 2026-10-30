import React, { useState, useEffect, useRef } from 'react'
import {
  MeetingFormData,
  INITIAL_FORM_DATA,
  determineTier,
  getProductDetails,
  computePains,
  computeObjections,
  calculateQualificationPercentage,
  buildMeetingSummary,
} from '@/lib/assistente-comercial-data'
import { LiveSidePanel } from '@/components/assistente/LiveSidePanel'
import {
  Step1Identification,
  Step2Qualification,
  Step3Recommendation,
  Step4Notes,
  Step5Closing,
} from '@/components/assistente/AssistenteSteps'
import { AssistentePrint } from '@/components/assistente/AssistentePrint'
import {
  ReuniaoComercialRecord,
  listReunioesComerciais,
  saveReuniaoComercial,
} from '@/services/reunioesComerciais'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RotateCcw,
  Sparkles,
  Clock,
  History,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Identificação' },
  { id: 2, label: 'Qualificação' },
  { id: 3, label: 'Recomendação' },
  { id: 4, label: 'Anotações' },
  { id: 5, label: 'Fechamento' },
]

export default function AssistenteComercial() {
  const { toast } = useToast()

  // Estado do formulário
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<MeetingFormData>(INITIAL_FORM_DATA)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [summaryText, setSummaryText] = useState('')
  const [currentMeetingId, setCurrentMeetingId] = useState<string | undefined>(undefined)

  // Cronômetro
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerElapsed, setTimerElapsed] = useState(0)
  const timerStartRef = useRef<number>(0)
  const timerIntervalRef = useRef<any>(null)

  // Histórico
  const [historyList, setHistoryList] = useState<ReuniaoComercialRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedHistMeeting, setSelectedHistMeeting] = useState<ReuniaoComercialRecord | null>(
    null,
  )

  // Dialog de Reset
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  // Carregar histórico inicial do PocketBase
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoadingHistory(true)
    const list = await listReunioesComerciais(20)
    setHistoryList(list)
    setIsLoadingHistory(false)
  }

  // Cronômetro
  useEffect(() => {
    if (timerRunning) {
      timerStartRef.current = Date.now() - timerElapsed
      timerIntervalRef.current = setInterval(() => {
        setTimerElapsed(Date.now() - timerStartRef.current)
      }, 500)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [timerRunning])

  const toggleTimer = () => {
    setTimerRunning((prev) => !prev)
  }

  const resetTimer = () => {
    setTimerRunning(false)
    setTimerElapsed(0)
  }

  // Cálculos dinâmicos
  const tier = determineTier(formData)
  const { productName, price, tableKey, anchorText } = getProductDetails(tier)
  const pains = computePains(tier, formData)
  const objections = computeObjections(formData)
  const qualificationPct = calculateQualificationPercentage(formData)

  // Atualização de campos
  const handleFormChange = (fields: Partial<MeetingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }))
    // Limpar erros dos campos alterados
    if (Object.keys(fields).length > 0) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        Object.keys(fields).forEach((k) => delete next[k])
        return next
      })
    }
  }

  // Validação por etapa
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.leadName.trim()) errors.leadName = 'Informe o nome do lead.'
      if (!formData.company.trim()) errors.company = 'Informe a empresa.'
      if (!formData.segment.trim()) errors.segment = 'Selecione o segmento.'
      if (!formData.employees || Number(formData.employees) <= 0) {
        errors.employees = 'Informe um número maior que zero.'
      }
      if (!formData.tenure.trim()) errors.tenure = 'Informe o tempo de empresa.'
      if (!formData.channel.trim()) errors.channel = 'Selecione o canal.'
      if (!formData.interest.trim()) errors.interest = 'Selecione a linha de interesse.'
      if (!formData.participants.trim()) errors.participants = 'Informe os participantes.'
      if (!formData.decisor.trim()) errors.decisor = 'Informe se o decisor está presente.'
    } else if (step === 2) {
      if (!formData.revenue) errors.revenue = 'Escolha uma faixa de faturamento.'
      if (!formData.urgency) errors.urgency = 'Escolha o nível de urgência.'
      if (!formData.history) errors.history = 'Escolha o histórico de consultoria.'
      if (!formData.liquidity) errors.liquidity = 'Escolha a capacidade de investimento.'
      if (!formData.readiness) errors.readiness = 'Escolha a prontidão emocional.'
      if (!formData.dorPrincipal.trim()) errors.dorPrincipal = 'Registre a principal dor do lead.'
    } else if (step === 5) {
      if (!formData.resultado) errors.resultado = 'Selecione o resultado da reunião.'
    }

    setValidationErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Atenção',
        description: 'Revise os campos obrigatórios destacados antes de avançar.',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGoToStep = (step: number) => {
    // Permite navegar livremente ou validar
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Gerar resumo
  const handleGenerateSummary = () => {
    const text = buildMeetingSummary(formData, tier, formatCurrency)
    setSummaryText(text)
    toast({
      title: 'Resumo Gerado',
      description: 'O texto resumido da reunião foi montado com sucesso.',
    })
  }

  // Salvar no histórico e funil
  const handleSaveToHistory = async () => {
    if (!formData.leadName.trim()) {
      toast({
        title: 'Nome Obrigatório',
        description: 'Informe o nome do lead antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const generatedSummary = summaryText || buildMeetingSummary(formData, tier, formatCurrency)
      const res = await saveReuniaoComercial(formData, generatedSummary, currentMeetingId)
      setCurrentMeetingId(res.reuniao.id)
      setSummaryText(generatedSummary)

      toast({
        title: 'Reunião Salva',
        description: `Dados registrados no histórico do sistema e card atualizado no Funil de Vendas.`,
      })

      // Recarrega lista
      await loadHistory()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível persistir a reunião no banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Copiar resumo
  const handleCopySummary = () => {
    const textToCopy = summaryText || buildMeetingSummary(formData, tier, formatCurrency)
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    toast({
      title: 'Copiado',
      description: 'Resumo da reunião copiado para a área de transferência.',
    })
  }

  // Imprimir resumo
  const handlePrintSummary = () => {
    // Garante que o texto estruturado do resumo esteja gerado caso o usuário ainda não tenha clicado em "Gerar Resumo"
    if (!summaryText) {
      const generated = buildMeetingSummary(formData, tier, formatCurrency)
      setSummaryText(generated)
    }

    const originalTitle = document.title
    const leadIdentifier = formData.leadName || formData.company || 'Reuniao'
    document.title = `Resumo-Comercial-${leadIdentifier.replace(/\s+/g, '_')}`

    // Aguarda microtick para garantir que o título e eventuais estados estejam atualizados antes de disparar o print
    setTimeout(() => {
      window.print()
      document.title = originalTitle
    }, 100)
  }

  // Resetar reunião
  const handleConfirmReset = () => {
    setFormData(INITIAL_FORM_DATA)
    setValidationErrors({})
    setSummaryText('')
    setCurrentMeetingId(undefined)
    resetTimer()
    setCurrentStep(1)
    setIsResetDialogOpen(false)
    toast({
      title: 'Nova Reunião',
      description: 'Todos os campos foram limpos para uma nova reunião.',
    })
  }

  // Carregar reunião do histórico
  const handleLoadFromHistory = (rec: ReuniaoComercialRecord) => {
    setSelectedHistMeeting(rec)
  }

  const handleApplyMeetingToForm = (rec: ReuniaoComercialRecord) => {
    setFormData({
      leadName: rec.lead_nome || '',
      company: rec.empresa || '',
      segment: rec.segmento || '',
      employees: rec.colaboradores ? String(rec.colaboradores) : '',
      tenure: rec.tempo_empresa || '',
      channel: rec.canal_origem || '',
      interest: (rec.linha_interesse as any) || '',
      participants: rec.participantes || '',
      decisor: (rec.decisor_presente as any) || '',

      revenue: (rec.faturamento as any) || '',
      urgency: (rec.urgencia as any) || '',
      history: (rec.historico_consultoria as any) || '',
      liquidity: (rec.capacidade_investimento as any) || '',
      readiness: (rec.prontidao_emocional as any) || '',

      dorPrincipal: rec.dor_principal || '',
      sonoFuturo: rec.sono_futuro || '',
      horasOperacao: rec.horas_operacao || '',
      sair15Dias: rec.sair_15_dias || '',
      saidaGestor: rec.saida_gestor || '',
      custoRotatividade: rec.custo_rotatividade || '',
      cenario12Meses: rec.cenario_12_meses || '',

      compromissos: rec.compromissos || '',
      numerosCitados: rec.numeros_citados || '',
      termosCliente: rec.termos_cliente || '',
      indicacoes: rec.indicacoes || '',
      proximoPasso: rec.proximo_passo || '',
      dataProximoContato: rec.data_proximo_contato || '',

      resultado: rec.resultado || '',
      condicaoEscolhida: rec.condicao_escolhida || '',
      formaPagamento: rec.forma_pagamento || '',
    })

    setCurrentMeetingId(rec.id)
    setSummaryText(rec.resumo_texto || '')
    setSelectedHistMeeting(null)
    setCurrentStep(1)
    toast({
      title: 'Reunião Carregada',
      description: `Dados de ${rec.lead_nome} carregados nos campos.`,
    })
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Header Comercial */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border/70 rounded-xl p-5 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Uso interno • Reuniões ao vivo
            </span>
            <Badge variant="outline" className="text-xs">
              {formData.leadName ? `Lead: ${formData.leadName}` : 'Lead não identificado'}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Assistente Comercial — Neomaster e Neoprime
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Preencha durante a conversa; a recomendação, dores, objeções e roteiro atualizam ao
            vivo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsResetDialogOpen(true)}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Nova Reunião
          </Button>
        </div>
      </div>

      {/* Barra de Progresso e Navegação das Etapas */}
      <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Etapa {currentStep} de 5 — {STEPS[currentStep - 1].label}
          </span>
          <span className="font-mono">{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleGoToStep(step.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : isCompleted
                      ? 'bg-muted/70 text-foreground border-border hover:bg-muted'
                      : 'bg-background text-muted-foreground border-border/60 hover:text-foreground'
                }`}
              >
                <span>{step.id}.</span> {step.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Principal: Formulário das Etapas + Painel Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna da Etapa Atual (Formulário) */}
        <div className="lg:col-span-8 space-y-6">
          {currentStep === 1 && (
            <Step1Identification
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              validationErrors={validationErrors}
            />
          )}

          {currentStep === 2 && (
            <Step2Qualification
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              validationErrors={validationErrors}
            />
          )}

          {currentStep === 3 && (
            <Step3Recommendation
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              productName={productName}
              price={price}
              pains={pains}
              objections={objections}
              validationErrors={validationErrors}
            />
          )}

          {currentStep === 4 && (
            <Step4Notes
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              validationErrors={validationErrors}
            />
          )}

          {currentStep === 5 && (
            <Step5Closing
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              onGenerateSummary={handleGenerateSummary}
              summaryText={summaryText}
              onCopySummary={handleCopySummary}
              onPrintSummary={handlePrintSummary}
              onSaveToHistory={handleSaveToHistory}
              isSaving={isSaving}
              validationErrors={validationErrors}
            />
          )}

          {/* Histórico de Reuniões Salvas na Base de Dados */}
          <Card className="border-border shadow-sm print:hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base font-bold">Histórico de Reuniões</CardTitle>
                </div>
                <Badge variant="secondary">
                  {historyList.length} {historyList.length === 1 ? 'reunião' : 'reuniões'}
                </Badge>
              </div>
              <CardDescription>
                Reuniões registradas e persistidas no sistema. Clique para revisar ou carregar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-6 text-sm text-muted-foreground animate-pulse">
                  Carregando reuniões...
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                  Nenhuma reunião registrada ainda. Registre o fechamento para salvar.
                </div>
              ) : (
                <div className="divide-y divide-border border rounded-lg overflow-hidden">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadFromHistory(item)}
                      className="p-3.5 hover:bg-muted/50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <span>{item.lead_nome}</span>
                          <span className="text-muted-foreground font-normal">•</span>
                          <span className="text-muted-foreground text-xs">{item.empresa}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="text-primary font-medium">
                            {item.produto_recomendado}
                          </span>
                          {item.created && (
                            <span>
                              {new Date(item.created).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(item.created).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            item.resultado === 'Fechou'
                              ? 'default'
                              : item.resultado === 'Não qualificado'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs font-medium"
                        >
                          {item.resultado || 'Em andamento'}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna do Painel Lateral "Ao Vivo" */}
        <div className="lg:col-span-4 print:hidden">
          <LiveSidePanel
            tier={tier}
            productName={productName}
            price={price}
            tableKey={tableKey}
            anchorText={anchorText}
            pains={pains}
            objections={objections}
            qualificationPct={qualificationPct}
            urgency={formData.urgency}
            timerRunning={timerRunning}
            timerElapsed={timerElapsed}
            onToggleTimer={toggleTimer}
            onResetTimer={resetTimer}
          />
        </div>
      </div>

      {/* Dialog de Confirmação para Iniciar Nova Reunião */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar nova reunião?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os campos preenchidos serão limpos. Reuniões já salvas no histórico permanecerão
              preservadas no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar e começar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Elemento de Impressão Isolado para A4 / PDF */}
      <AssistentePrint
        formData={formData}
        tier={tier}
        productName={productName}
        price={price}
        tableKey={tableKey}
        pains={pains}
        objections={objections}
        summaryText={summaryText}
      />

      {/* Dialog de Visualização de Reunião do Histórico */}
      <Dialog
        open={!!selectedHistMeeting}
        onOpenChange={(open) => !open && setSelectedHistMeeting(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between pr-6">
              <span>{selectedHistMeeting?.lead_nome}</span>
              <Badge variant="outline">{selectedHistMeeting?.resultado || 'Em andamento'}</Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedHistMeeting?.empresa} • {selectedHistMeeting?.produto_recomendado} (
              {selectedHistMeeting?.created &&
                new Date(selectedHistMeeting.created).toLocaleDateString('pt-BR')}
              )
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-sm">
            <div className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-slate-800">
              {selectedHistMeeting?.resumo_texto || 'Sem resumo textual gravado.'}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedHistMeeting?.resumo_texto) {
                    navigator.clipboard.writeText(selectedHistMeeting.resumo_texto)
                    toast({ title: 'Copiado', description: 'Resumo copiado.' })
                  }
                }}
              >
                Copiar Resumo
              </Button>
              <Button
                onClick={() => selectedHistMeeting && handleApplyMeetingToForm(selectedHistMeeting)}
              >
                Carregar no Formulário
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
