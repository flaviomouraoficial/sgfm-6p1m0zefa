import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import pb from '@/lib/pocketbase/client'
import { Progress } from '@/components/ui/progress'
import { Building2, CheckCircle2 } from 'lucide-react'
import { AssessmentQuestion } from '@/lib/types'

type LinkInfo = {
  id: string
  cliente_id: string
  cliente_nome: string
}

export default function PublicAssessment() {
  const { slug } = useParams()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [pillars, setPillars] = useState<
    { id: string; name: string; qStart: number; qEnd: number }[]
  >([])

  const [step, setStep] = useState(0) // 0: auth/profile, 1 to N: question groups, N+1: success
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    grau_parentesco: '',
    atua_na_organizacao: false,
  })
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await pb.send(`/backend/v1/assessment/link/${slug}`, { method: 'GET' })
        setLinkInfo(res)
        const qRes = await pb
          .collection('v1_assessment_questions')
          .getFullList<AssessmentQuestion>({ sort: 'order' })
        setQuestions(qRes)

        const pNames = [...new Set(qRes.map((q) => q.pilar))]
        const pList = pNames.map((name, i) => {
          const pQs = qRes.filter((q) => q.pilar === name)
          return {
            id: `pilar_${i + 1}`,
            name,
            qStart: pQs[0].order,
            qEnd: pQs[pQs.length - 1].order,
          }
        })
        setPillars(pList)
      } catch (err: any) {
        setError(err.message || 'Link inválido ou expirado.')
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !linkInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const handleStart = () => {
    if (!formData.nome || !formData.email || !formData.grau_parentesco) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    setStep(1)
  }

  const currentPillarIndex = step - 1
  const currentPillar = pillars[currentPillarIndex]

  const handleAnswer = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: Number(val) }))
  }

  const canGoNext = () => {
    if (!currentPillar) return false
    for (let i = currentPillar.qStart; i <= currentPillar.qEnd; i++) {
      if (!answers[`q${i}`]) return false
    }
    return true
  }

  const handleNext = () => {
    if (!canGoNext()) {
      toast({
        title: 'Por favor, responda todas as perguntas desta etapa.',
        variant: 'destructive',
      })
      return
    }
    if (step < pillars.length) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await pb.send(`/backend/v1/assessment/submit/${slug}`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          respostas: answers,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      setStep(pillars.length + 1)
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar respostas',
        description: err.message || 'Erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (step === pillars.length + 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardContent className="pt-10 pb-8 flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <CardTitle className="mb-2">Assessment Concluído!</CardTitle>
            <CardDescription className="text-base">
              Suas respostas foram salvas com sucesso. Agradecemos a sua participação.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = step === 0 ? 0 : Math.round((step / pillars.length) * 100)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <Building2 className="w-6 h-6" />
          {linkInfo.cliente_nome}
        </div>
        <div className="text-sm font-medium text-slate-500">Assessment de Sucessão</div>
      </div>

      <Card className="w-full max-w-3xl shadow-xl bg-white border-t-4 border-t-primary">
        {step > 0 && (
          <div className="w-full h-1.5 bg-slate-100 rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        <CardHeader className="border-b bg-slate-50/50">
          {step === 0 ? (
            <>
              <CardTitle className="text-2xl">Dados do Perfil</CardTitle>
              <CardDescription>Para iniciar, preencha os dados abaixo.</CardDescription>
            </>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <CardDescription className="uppercase tracking-wider font-bold text-primary mb-1">
                  Pilar {currentPillarIndex + 1} de {pillars.length}
                </CardDescription>
                <CardTitle className="text-2xl">{currentPillar?.name}</CardTitle>
              </div>
              <div className="text-sm font-medium text-slate-400">{progress}%</div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-8">
          {step === 0 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grau">Grau de Parentesco / Vínculo</Label>
                <Select
                  value={formData.grau_parentesco}
                  onValueChange={(v) => setFormData({ ...formData, grau_parentesco: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socio">Sócio / Fundador</SelectItem>
                    <SelectItem value="filho">Filho(a)</SelectItem>
                    <SelectItem value="genro">Genro / Nora</SelectItem>
                    <SelectItem value="sobrinho">Sobrinho(a)</SelectItem>
                    <SelectItem value="gerente">Gerente / Diretor Não-Familiar</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="atua"
                  checked={formData.atua_na_organizacao}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, atua_na_organizacao: c as boolean })
                  }
                />
                <Label htmlFor="atua" className="font-normal cursor-pointer">
                  Já atuo na organização atualmente.
                </Label>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {questions
                .filter((q) => q.pilar === currentPillar?.name)
                .map((q) => {
                  const qId = `q${q.order}`
                  return (
                    <div key={qId} className="space-y-4 bg-slate-50 p-5 rounded-lg border">
                      <Label className="text-base font-semibold leading-relaxed">
                        {q.order}. {q.text_full}
                      </Label>
                      <RadioGroup
                        value={answers[qId]?.toString()}
                        onValueChange={(val) => handleAnswer(qId, val)}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2"
                      >
                        {[
                          { val: '1', label: 'Discordo Totalmente' },
                          { val: '2', label: 'Discordo em Parte' },
                          { val: '3', label: 'Neutro' },
                          { val: '4', label: 'Concordo em Parte' },
                          { val: '5', label: 'Concordo Totalmente' },
                        ].map((opt) => (
                          <Label
                            key={opt.val}
                            className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all hover:border-primary ${
                              answers[qId]?.toString() === opt.val
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'bg-white'
                            }`}
                          >
                            <RadioGroupItem value={opt.val} className="sr-only" />
                            <span className="text-lg font-bold mb-1">{opt.val}</span>
                            <span className="text-[10px] text-center text-slate-500 uppercase tracking-wider">
                              {opt.label}
                            </span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between bg-slate-50 border-t p-6">
          {step > 0 ? (
            <Button variant="outline" onClick={handleBack} disabled={submitting}>
              Voltar
            </Button>
          ) : (
            <div></div> // spacer
          )}

          {step === 0 ? (
            <Button onClick={handleStart} className="w-full sm:w-auto px-8">
              Iniciar Avaliação
            </Button>
          ) : step === pillars.length ? (
            <Button onClick={handleNext} disabled={submitting} className="w-full sm:w-auto px-8">
              {submitting ? 'Enviando...' : 'Finalizar e Enviar'}
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full sm:w-auto px-8">
              Próxima Etapa
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
