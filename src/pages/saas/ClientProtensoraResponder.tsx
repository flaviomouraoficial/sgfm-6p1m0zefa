import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Trophy, Star, Medal, PartyPopper } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function ClientProtensoraResponder() {
  const { moduloId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [modulo, setModulo] = useState<any>(null)
  const [questoes, setQuestoes] = useState<any[]>([])
  const [respostas, setRespostas] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showVictory, setShowVictory] = useState(false)
  const [submittedAnswer, setSubmittedAnswer] = useState(false)
  const [moduleCompleted, setModuleCompleted] = useState(false)
  const [trailStatus, setTrailStatus] = useState<{
    completed: boolean
    cert: boolean
    minScore: number
  }>({ completed: false, cert: false, minScore: 70 })

  async function load() {
    if (!moduloId || !user?.id) return
    try {
      const m = await pb.collection('v1_protensora_modulos').getOne(moduloId)
      setModulo(m)
      const q = await pb
        .collection('v1_protensora_questoes')
        .getFullList({ filter: `modulo_id='${moduloId}'`, sort: 'order' })
      setQuestoes(q)
      const r = await pb
        .collection('v1_protensora_respostas')
        .getFullList({ filter: `modulo_id='${moduloId}' && user_id='${user.id}'` })
      setRespostas(r)

      const allAnswered = q.length > 0 && r.length >= q.length
      setModuleCompleted(allAnswered)

      const nextIndex = q.findIndex((quest) => !r.some((resp) => resp.questao_id === quest.id))
      if (allAnswered) {
        setCurrentStep(0)
        setSubmittedAnswer(true)
      } else {
        setCurrentStep(nextIndex === -1 ? (q.length > 0 ? q.length - 1 : 0) : nextIndex)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [moduloId, user])

  useEffect(() => {
    if (questoes.length > 0) {
      const q = questoes[currentStep]
      const existing = respostas.find((r) => r.questao_id === q.id)
      if (existing) {
        setCurrentAnswer(existing.answer_value?.value || '')
        setSubmittedAnswer(true)
      } else {
        setCurrentAnswer('')
        setSubmittedAnswer(false)
      }
    }
  }, [currentStep, questoes, respostas])

  const handleAnswer = async () => {
    if (!pb.authStore.isValid || !user?.id) {
      toast({
        title: 'Sessão Expirada',
        description:
          'Sua sessão expirou ou é inválida. Por favor, atualize a página ou faça login novamente.',
        variant: 'destructive',
      })
      return
    }
    if (!currentAnswer.trim()) {
      toast({
        title: 'Resposta em branco',
        description: 'Por favor, selecione uma opção válida.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const q = questoes[currentStep]
      let existing
      try {
        existing = await pb
          .collection('v1_protensora_respostas')
          .getFirstListItem(`user_id='${user.id}' && questao_id='${q.id}'`)
      } catch (err: any) {
        if (err.status !== 404)
          throw new Error('Falha de rede ao verificar respostas. Tente novamente.')
      }

      const isCorrect = String(currentAnswer).trim() === String(q.resposta_correta).trim()

      const payload = {
        user_id: user.id,
        questao_id: q.id,
        modulo_id: moduloId,
        trilha_id: modulo?.trilha_id,
        answer_value: { value: String(currentAnswer) },
        score: isCorrect ? Number(q.xp_acerto || q.weight || 50) : 0,
      }

      let res
      if (existing) {
        res = await pb.collection('v1_protensora_respostas').update(existing.id, payload)
      } else {
        res = await pb.collection('v1_protensora_respostas').create(payload)

        if (payload.score > 0) {
          let trailProg
          try {
            trailProg = await pb
              .collection('v1_protensora_progresso')
              .getFirstListItem(`user_id='${user?.id}' && trilha_id='${modulo?.trilha_id}'`)
          } catch (err: any) {
            if (err.status !== 404)
              throw new Error('Falha de rede ao verificar progresso da trilha.')
          }

          if (trailProg) {
            await pb.collection('v1_protensora_progresso').update(trailProg.id, {
              score: (trailProg.score || 0) + payload.score,
            })
          } else {
            await pb.collection('v1_protensora_progresso').create({
              user_id: user?.id,
              trilha_id: modulo?.trilha_id,
              score: payload.score,
              percentage: 0,
            })
          }
        }
      }

      setRespostas((prev) => {
        const idx = prev.findIndex((r) => r.questao_id === q.id)
        let newArr
        if (idx >= 0) {
          newArr = [...prev]
          newArr[idx] = res
        } else {
          newArr = [...prev, res]
        }
        if (questoes.length > 0 && newArr.length >= questoes.length) {
          setModuleCompleted(true)
        }
        return newArr
      })

      setSubmittedAnswer(true)
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar resposta',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (currentStep < questoes.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      if (moduleCompleted) {
        navigate(`/dashboard/protensora/trilha/${modulo?.trilha_id}`)
        return
      }
      if (modulo?.trilha_id && user) {
        try {
          const prog = await pb
            .collection('v1_protensora_progresso')
            .getFirstListItem(`user_id='${user.id}' && trilha_id='${modulo.trilha_id}'`)
          if (prog?.completed) {
            const certs = await pb
              .collection('v1_protensora_certificados')
              .getFullList({ filter: `user_id='${user.id}' && trilha_id='${modulo.trilha_id}'` })
            const tr = await pb.collection('v1_protensora_trilhas').getOne(modulo.trilha_id)
            setTrailStatus({
              completed: true,
              cert: certs.length > 0,
              minScore: tr.min_score_certificate || 70,
            })
            setShowVictory(true)
            return
          }
        } catch {
          // Default fallthrough
        }
      }
      navigate(`/dashboard/protensora/trilha/${modulo?.trilha_id}`)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )

  if (!questoes.length)
    return (
      <div className="p-8 text-center border rounded-xl m-6">
        Nenhuma questão encontrada para este módulo.
      </div>
    )

  const q = questoes[currentStep]
  const pct = ((currentStep + 1) / questoes.length) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 relative">
      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
        <Button variant="ghost" asChild className="-ml-4">
          <Link to={`/dashboard/protensora/trilha/${modulo?.trilha_id}`}>
            &larr; Sair do Módulo
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
            <Star className="w-4 h-4 fill-current" /> Pesa {q.weight || 1} pts
          </span>
          <span className="bg-muted px-3 py-1 rounded-full">
            Questão {currentStep + 1} de {questoes.length}
          </span>
        </div>
      </div>
      <Progress value={pct} className="h-2" />

      <Card className="border-2 border-[#1e3a8a]/10 shadow-md">
        <CardHeader className="bg-muted/20 border-b pb-5">
          <CardTitle className="text-xl leading-relaxed text-foreground">{q.text}</CardTitle>
        </CardHeader>
        <CardContent className="py-8 space-y-6">
          {q.tipo === 'text' || q.type === 'text' ? (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Sua Resposta</Label>
              <Input
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                className="h-12 text-base"
                disabled={submittedAnswer || saving}
              />
            </div>
          ) : (
            <RadioGroup
              key={q.id}
              value={currentAnswer}
              onValueChange={setCurrentAnswer}
              className="space-y-3"
              disabled={submittedAnswer || saving}
            >
              {(Array.isArray(q.alternativas)
                ? q.alternativas
                : q.options?.choices || q.options || []
              ).map((alt: any, idx: number) => {
                const altId = String(alt?.id ?? idx.toString())
                const altTexto = typeof alt === 'string' ? alt : alt?.texto || altId
                const isSelected = String(currentAnswer) === altId
                let bgClass = isSelected
                  ? 'border-[#1e3a8a] bg-blue-50/50'
                  : 'border-border hover:bg-muted'

                if (submittedAnswer) {
                  const isCorrectOption = altId.trim() === String(q.resposta_correta).trim()
                  if (isCorrectOption) bgClass = 'border-green-500 bg-green-50/80'
                  else if (isSelected && !isCorrectOption) bgClass = 'border-red-500 bg-red-50/80'
                  else bgClass = 'border-border opacity-50'
                }

                return (
                  <div
                    key={altId}
                    className={`flex items-center space-x-3 border-2 p-4 rounded-xl cursor-pointer transition-colors ${bgClass}`}
                    onClick={() => !submittedAnswer && !saving && setCurrentAnswer(altId)}
                  >
                    <RadioGroupItem
                      value={altId}
                      id={`alt-${altId}`}
                      disabled={submittedAnswer || saving}
                    />
                    <Label
                      htmlFor={`alt-${altId}`}
                      className="cursor-pointer text-base w-full font-medium"
                    >
                      {altTexto}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          )}

          {submittedAnswer && (
            <div
              className={`p-4 rounded-xl border ${String(currentAnswer).trim() === String(q.resposta_correta).trim() ? 'bg-green-100 border-green-200 text-green-900' : 'bg-red-100 border-red-200 text-red-900'}`}
            >
              <div className="flex items-center gap-2 mb-2 font-bold text-lg">
                {String(currentAnswer).trim() === String(q.resposta_correta).trim() ? (
                  <>🎉 Correto! Você ganhou {q.xp_acerto || 50} XP.</>
                ) : (
                  <>❌ Resposta Incorreta.</>
                )}
              </div>
              {q.explicacao && (
                <div className="mt-2 text-sm leading-relaxed opacity-90">
                  <span className="font-semibold block mb-1">Explicação:</span>
                  {q.explicacao}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10 pt-4 flex justify-end border-t">
          {!submittedAnswer && !moduleCompleted ? (
            <Button
              onClick={handleAnswer}
              disabled={saving || !currentAnswer}
              className="bg-[#1e3a8a] text-white px-8 h-11 text-base"
            >
              {saving ? 'Verificando...' : 'Responder'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-[#1e3a8a] text-white px-8 h-11 text-base"
            >
              {currentStep === questoes.length - 1
                ? 'Finalizar e Voltar para Trilha'
                : 'Próxima Questão'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog
        open={showVictory}
        onOpenChange={(open) =>
          !open && navigate(`/dashboard/protensora/trilha/${modulo?.trilha_id}`)
        }
      >
        <DialogContent className="sm:max-w-md text-center p-8">
          <div className="flex justify-center mb-6 text-yellow-500 relative">
            <div className="absolute inset-0 animate-ping opacity-20">
              <PartyPopper className="w-20 h-20 mx-auto" />
            </div>
            {trailStatus.completed && trailStatus.cert ? (
              <Medal className="w-20 h-20 animate-bounce relative z-10 drop-shadow-lg text-amber-500" />
            ) : (
              <Trophy className="w-20 h-20 animate-bounce relative z-10 drop-shadow-lg" />
            )}
          </div>
          <DialogTitle className="text-3xl text-center font-bold text-[#1e3a8a]">
            Parabéns!
          </DialogTitle>
          <DialogDescription className="text-center text-lg mt-3 text-foreground">
            {trailStatus.completed
              ? 'Você concluiu a trilha inteira!'
              : 'Você concluiu este módulo com sucesso.'}
          </DialogDescription>

          {trailStatus.completed ? (
            <div
              className={`mt-4 p-4 rounded-lg border ${trailStatus.cert ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}
            >
              {trailStatus.cert ? (
                <>
                  <p className="text-sm font-bold text-green-800">
                    Você ganhou um Certificado de Conclusão!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Acesse a aba "Certificados" no seu painel para baixar o PDF.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-amber-800">
                    Trilha concluída, mas sem certificado.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Você precisa de pelo menos {trailStatus.minScore}% de aproveitamento para
                    receber o certificado. Revise o material e tente novamente!
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-[#1e3a8a]">
                Seu progresso e pontos foram salvos automaticamente.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Continue assim para desbloquear mais conquistas e subir no ranking!
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => navigate(`/dashboard/protensora/trilha/${modulo?.trilha_id}`)}
              className="bg-[#1e3a8a] text-lg px-8 h-12 w-full"
            >
              Voltar para a Trilha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
