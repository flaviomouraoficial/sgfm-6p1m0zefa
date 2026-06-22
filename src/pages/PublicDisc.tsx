import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { DISC_QUESTIONS } from '@/lib/disc-data'
import { DiscReport } from '@/components/disc/DiscReport'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

type Step = 'form' | 'instructions' | 'test' | 'report'

export default function PublicDisc() {
  const { token } = useParams()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkData, setLinkData] = useState<any>(null)

  const [formData, setFormData] = useState({ nome: '', email: '' })
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentQIndex, setCurrentQIndex] = useState(0)

  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const res = await pb.send(`/backend/v1/disc/link/${token}`, { method: 'GET' })
        let logoUrl = res.logoUrl
        if (logoUrl && logoUrl.startsWith('/')) {
          logoUrl = pb.baseUrl + logoUrl
        }
        setLinkData({ ...res, logoUrl })
      } catch (err: any) {
        setError(err.message || 'Link inválido ou expirado.')
      } finally {
        setLoading(false)
      }
    }
    fetchLink()
  }, [token])

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome || !formData.email) {
      toast({ title: 'Atenção', description: 'Preencha nome e email.', variant: 'destructive' })
      return
    }
    setStep('instructions')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQIndex]: val }))
  }

  const handleNextQ = () => {
    if (!answers[currentQIndex]) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma resposta antes de continuar.',
        variant: 'destructive',
      })
      return
    }
    if (currentQIndex < DISC_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      finishTest()
    }
  }

  const handlePrevQ = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const finishTest = async () => {
    setSaving(true)
    try {
      const scores = { D: 0, I: 0, S: 0, C: 0 }
      Object.entries(answers).forEach(([_, profile]) => {
        const p = profile as keyof typeof scores
        if (scores[p] !== undefined) scores[p]++
      })

      const profiles = ['D', 'I', 'S', 'C'] as const
      let maxScore = -1
      let predominante = 'I'
      profiles.forEach((p) => {
        if (scores[p] > maxScore) {
          maxScore = scores[p]
          predominante = p
        }
      })

      const payload = {
        token,
        nome: formData.nome,
        email: formData.email,
        pontuacao_d: scores.D,
        pontuacao_i: scores.I,
        pontuacao_s: scores.S,
        pontuacao_c: scores.C,
        perfil_predominante: predominante,
        respostas_json: answers,
      }

      await pb.send('/backend/v1/disc/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setReportData({
        nome: formData.nome,
        empresa: linkData.empresa || 'Organização Confidencial',
        logoUrl: linkData.logoUrl,
        scores,
        predominante,
      })
      setStep('report')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha na comunicação.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-destructive">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-600">
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'report' && reportData) {
    return <DiscReport {...reportData} />
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
        <Card className="w-full max-w-lg shadow-xl border-primary/20">
          <CardHeader className="bg-primary/5 border-b pb-6 text-center">
            <CardTitle className="text-3xl text-primary mb-2">Assessment DISC</CardTitle>
            <p className="text-slate-600">Preencha seus dados para iniciar a avaliação.</p>
          </CardHeader>
          <form onSubmit={handleStart}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Empresa / Cliente</Label>
                <Input
                  value={linkData?.empresa || 'Empresa não informada'}
                  disabled
                  className="bg-slate-100 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t pt-6">
              <Button type="submit" className="w-full text-lg h-12">
                Continuar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  if (step === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-2xl text-primary">Instruções Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 text-slate-700 leading-relaxed text-lg">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Este teste tem como objetivo identificar seu perfil comportamental predominante.
              </li>
              <li>
                <strong>Não existem respostas certas ou erradas</strong> — responda com honestidade.
              </li>
              <li>
                Escolha a palavra que <strong>MAIS se aproxima</strong> de como você é, não do que
                gostaria de ser.
              </li>
              <li>
                Você deve iniciar e terminar o teste sem interrupções — reserve de 10 a 15 minutos.
              </li>
              <li>Escolha um local tranquilo e sem distrações.</li>
              <li>
                Se tiver dificuldade com alguma palavra, peça ajuda a alguém que te conheça bem.
              </li>
              <li>
                Suas respostas são totalmente confidenciais e usadas apenas para gerar o seu
                relatório.
              </li>
            </ul>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t pt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep('form')}>
              Voltar
            </Button>
            <Button onClick={() => setStep('test')} size="lg">
              Iniciar Teste
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const q = DISC_QUESTIONS[currentQIndex]
  const progress = (currentQIndex / DISC_QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-slate-500">
            <span>
              Questão {currentQIndex + 1} de {DISC_QUESTIONS.length}
            </span>
            <span>{Math.round(progress)}% Concluído</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2 border-primary/20 shadow-md bg-white">
          <CardHeader className="bg-slate-50/50 border-b pb-6 text-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              {q.type === 'positive'
                ? 'Qual palavra melhor te descreve?'
                : 'Qual palavra melhor te descreve (pontos a melhorar)?'}
            </p>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <RadioGroup
              value={answers[currentQIndex] || ''}
              onValueChange={handleAnswer}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {q.options.map((opt) => (
                <div
                  key={opt.letter}
                  className={`flex items-start space-x-3 p-6 border-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer ${
                    answers[currentQIndex] === opt.profile
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200'
                  }`}
                  onClick={() => handleAnswer(opt.profile)}
                >
                  <RadioGroupItem
                    value={opt.profile}
                    id={`q${q.id}-${opt.letter}`}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`q${q.id}-${opt.letter}`}
                      className="cursor-pointer font-medium text-xl w-full"
                    >
                      {opt.text}
                    </Label>
                    {opt.desc && (
                      <span className="text-xs text-muted-foreground mt-1">{opt.desc}</span>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between bg-slate-50/50 border-t pt-6">
            <Button
              variant="outline"
              onClick={handlePrevQ}
              disabled={saving || currentQIndex === 0}
            >
              Voltar
            </Button>
            <Button
              onClick={handleNextQ}
              disabled={saving || !answers[currentQIndex]}
              className="min-w-[140px]"
            >
              {saving
                ? 'Processando...'
                : currentQIndex === DISC_QUESTIONS.length - 1
                  ? 'Finalizar'
                  : 'Próxima'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
