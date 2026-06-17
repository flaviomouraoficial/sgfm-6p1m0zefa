import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function PublicLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium">Carregando ambiente...</p>
      </div>
    </div>
  )
}

export default function PublicAssessment() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentStep, setCurrentStep] = useState(-1)
  const [saving, setSaving] = useState(false)
  const [finished, setFinished] = useState(false)

  const [userInfo, setUserInfo] = useState({
    nome: '',
    email: '',
    grau_parentesco: 'outro',
    respondentLevel: '',
  })

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await pb.send(`/backend/v1/public-assessment/${slug}`, { method: 'GET' })
        setData(res)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Link inválido ou expirado.')
      } finally {
        setLoading(false)
      }
    }
    fetchAssessment()
  }, [slug])

  const handleAnswer = (val: string) => {
    if (!data) return
    setAnswers((prev) => ({ ...prev, [data.questions[currentStep].id]: parseInt(val) }))
  }

  const handleNext = async () => {
    if (currentStep === -1) {
      if (!userInfo.nome || !userInfo.email) {
        toast({ title: 'Atenção', description: 'Preencha nome e email.', variant: 'destructive' })
        return
      }
      if (data?.diagnostic?.type === 'strategic_360' && !userInfo.respondentLevel) {
        toast({
          title: 'Atenção',
          description: 'Selecione o seu nível na organização.',
          variant: 'destructive',
        })
        return
      }
      setCurrentStep(0)
      return
    }

    if (answers[data.questions[currentStep].id] === undefined) {
      toast({
        title: 'Atenção',
        description: 'Por favor, selecione uma resposta.',
        variant: 'destructive',
      })
      return
    }

    if (currentStep < data.questions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      finishAssessment()
    }
  }

  const finishAssessment = async () => {
    setSaving(true)
    try {
      const type = data.diagnostic.type
      const scaleMax = type === 'gestao' ? 3 : 10

      const dimensions = Array.from(new Set(data.questions.map((q: any) => q.dimension)))
      const scores: Record<string, number> = {}

      dimensions.forEach((dim: any) => {
        const dimQs = data.questions.filter((q: any) => q.dimension === dim)
        const sum = dimQs.reduce((acc: number, q: any) => acc + (answers[q.id] || 0), 0)
        scores[dim] = (sum / (dimQs.length * scaleMax)) * 10
      })

      const overall = Object.values(scores).reduce((a, b) => a + b, 0) / dimensions.length

      let classification = 'Crise'
      if (overall >= 9) classification = 'Excelência'
      else if (overall >= 8) classification = 'Potencial'
      else if (overall >= 6) classification = 'Atenção'
      else if (overall >= 4) classification = 'Risco'

      const payload = {
        ...userInfo,
        answers,
        scores,
        overall,
        classification,
      }

      await pb.send(`/backend/v1/public-assessment/${slug}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setFinished(true)
      setData(null)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      setSaving(false)
    }
  }

  if (loading) return <PublicLoader />

  if (finished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Concluído!</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-600">
            <p>
              Obrigado! Suas respostas foram registradas com sucesso. A equipe entrará em contato em
              breve.
            </p>
            <Button className="mt-8 w-full" onClick={() => navigate('/login')}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-destructive">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-600">
            <p>{error || 'Link inválido ou expirado.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (data.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Diagnóstico Vazio</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-600">
            <p>Este diagnóstico não possui questões cadastradas.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const type = data.diagnostic.type

  if (currentStep === -1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
        <Card className="w-full max-w-xl shadow-xl border-primary/20">
          <CardHeader className="bg-primary/5 border-b pb-6 text-center">
            <CardTitle className="text-3xl text-primary mb-2">{data.diagnostic.title}</CardTitle>
            <p className="text-slate-600">
              {data.diagnostic.description || 'Preencha seus dados para iniciar a avaliação.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={userInfo.nome}
                onChange={(e) => setUserInfo({ ...userInfo, nome: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>

            {type === 'legacy' && (
              <div className="space-y-2">
                <Label>Grau de Parentesco / Relação</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={userInfo.grau_parentesco}
                  onChange={(e) => setUserInfo({ ...userInfo, grau_parentesco: e.target.value })}
                >
                  <option value="socio">Sócio</option>
                  <option value="gerente">Gerente</option>
                  <option value="filho">Filho(a)</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            )}

            {type === 'strategic_360' && (
              <div className="space-y-2">
                <Label>Seu Nível de Atuação (em relação ao avaliado)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={userInfo.respondentLevel}
                  onChange={(e) => setUserInfo({ ...userInfo, respondentLevel: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Estratégico">Estratégico (Diretoria/C-Level)</option>
                  <option value="Tático">Tático (Gerência/Coordenação)</option>
                  <option value="Operacional">Operacional (Analistas/Assistentes)</option>
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50 border-t pt-6">
            <Button className="w-full text-lg h-12" onClick={handleNext}>
              Iniciar Avaliação
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const q = data.questions[currentStep]
  const progress = (currentStep / data.questions.length) * 100

  const options =
    type === 'gestao'
      ? [
          { val: 0, label: '0 - Inexistente / Crítico' },
          { val: 1, label: '1 - Inicial / Básico' },
          { val: 2, label: '2 - Parcial / Bom' },
          { val: 3, label: '3 - Otimizado / Excelente' },
        ]
      : Array.from({ length: 11 }).map((_, i) => ({
          val: i,
          label: i === 0 ? '0 - Nada a ver' : i === 10 ? '10 - Totalmente' : i.toString(),
        }))

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-slate-500">
            <span>Progresso</span>
            <span>
              {currentStep + 1} de {data.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2 border-primary/20 shadow-md bg-white">
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              {q.dimension}
            </p>
            <CardTitle className="text-2xl leading-relaxed text-slate-800">{q.text}</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <RadioGroup
              value={answers[q.id]?.toString()}
              onValueChange={handleAnswer}
              className={type === 'gestao' ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-11 gap-2'}
            >
              {options.map((opt) => (
                <div
                  key={opt.val}
                  className={`flex ${
                    type === 'gestao'
                      ? 'items-center space-x-3 p-4'
                      : 'flex-col items-center justify-center p-2 text-center h-24'
                  } border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
                    answers[q.id] === opt.val
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200'
                  }`}
                  onClick={() => handleAnswer(opt.val.toString())}
                >
                  <RadioGroupItem
                    value={opt.val.toString()}
                    id={`r${opt.val}`}
                    className={type === 'gestao' ? '' : 'mb-2'}
                  />
                  <Label
                    htmlFor={`r${opt.val}`}
                    className={`cursor-pointer font-medium ${
                      type === 'gestao' ? 'flex-1 text-base' : 'text-xs leading-tight'
                    }`}
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-4 bg-slate-50/50 border-t pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={currentStep === 0 || saving}
              className="w-full sm:w-auto"
            >
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              disabled={saving}
              className="w-full sm:w-auto min-w-[120px]"
            >
              {saving
                ? 'Enviando...'
                : currentStep === data.questions.length - 1
                  ? 'Concluir'
                  : 'Próxima Questão'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
