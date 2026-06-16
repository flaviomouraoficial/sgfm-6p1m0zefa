import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const PRISMA_DIMENSIONS = ['Execução', 'Relacionamento', 'Comportamento', 'Potencial']
const GESTAO_DIMENSIONS = [
  'Estratégia e Liderança',
  'Processos e Operações',
  'Pessoas e Cultura',
  'Finanças e Resultados',
]

const generateQuestions = (type: string) => {
  const dims = type === 'prisma' ? PRISMA_DIMENSIONS : GESTAO_DIMENSIONS
  let id = 1
  const qs = []
  for (const dim of dims) {
    for (let i = 0; i < 4; i++) {
      qs.push({
        id: `q${id++}`,
        dimension: dim,
        text: `Como você avalia o aspecto ${i + 1} de ${dim} na sua empresa ou atuação diária?`,
      })
    }
  }
  return { qs, dims }
}

export default function AssessmentFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [result, setResult] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [dimensions, setDimensions] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await pb.collection('v1_saas_results').getOne(id!, { expand: 'diagnostic' })
        if (res.status === 'Concluído' || res.status === 'cancelado') {
          navigate('/dashboard')
          return
        }
        setResult(res)

        const type = res.type || res.expand?.diagnostic?.type || 'gestao'
        const { qs, dims } = generateQuestions(type)
        setQuestions(qs)
        setDimensions(dims)

        if (res.result_json && res.result_json.answers) {
          setAnswers(res.result_json.answers)
        }
      } catch (err) {
        console.error(err)
        navigate('/dashboard')
      }
    }
    fetchResult()
  }, [id, navigate])

  const handleAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentStep].id]: parseInt(val) }))
  }

  const saveProgress = async (newAnswers: Record<string, number>) => {
    try {
      await pb.collection('v1_saas_results').update(id!, {
        result_json: { answers: newAnswers },
      })
    } catch (err) {
      console.error('Failed to save progress', err)
    }
  }

  const handleNext = async () => {
    if (!answers[questions[currentStep].id]) {
      toast({
        title: 'Atenção',
        description: 'Por favor, selecione uma resposta.',
        variant: 'destructive',
      })
      return
    }

    await saveProgress(answers)

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      finishAssessment()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  const finishAssessment = async () => {
    setSaving(true)
    try {
      const scores: Record<string, number> = {}
      dimensions.forEach((dim) => {
        const dimQs = questions.filter((q) => q.dimension === dim)
        const sum = dimQs.reduce((acc, q) => acc + (answers[q.id] || 0), 0)
        scores[dim] = sum / dimQs.length
      })

      const overall = Object.values(scores).reduce((a, b) => a + b, 0) / dimensions.length

      let classification = 'Risco'
      if (overall >= 4.5) classification = 'Estrela'
      else if (overall >= 3.5) classification = 'Manter'
      else if (overall >= 2.5) classification = 'Desenvolvimento'

      const finalJson = {
        answers,
        scores,
        overall,
        classification,
      }

      await pb.collection('v1_saas_results').update(id!, {
        result_json: finalJson,
        status: 'Concluído',
        completed_at: new Date().toISOString(),
      })

      toast({
        title: 'Diagnóstico Concluído',
        description: 'Seus resultados foram gerados com sucesso!',
        className: 'bg-[#10b981] text-white border-none',
      })
      navigate(`/dashboard/results?id=${id}`)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      setSaving(false)
    }
  }

  if (!result || questions.length === 0)
    return <div className="p-8 text-center text-muted-foreground">Carregando questionário...</div>

  const q = questions[currentStep]
  const progress = (currentStep / questions.length) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-8">
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>Progresso</span>
          <span>
            {currentStep + 1} de {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2 border-[#1e3a8a]/20 shadow-md">
        <CardHeader className="bg-muted/30 border-b pb-6">
          <p className="text-sm font-semibold text-[#1e3a8a] uppercase tracking-wider mb-2">
            {q.dimension}
          </p>
          <CardTitle className="text-2xl leading-relaxed">{q.text}</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <RadioGroup
            value={answers[q.id]?.toString()}
            onValueChange={handleAnswer}
            className="space-y-4"
          >
            {[
              { val: 1, label: '1 - Muito Ruim / Inexistente' },
              { val: 2, label: '2 - Ruim / Inicial' },
              { val: 3, label: '3 - Regular / Parcial' },
              { val: 4, label: '4 - Bom / Implementado' },
              { val: 5, label: '5 - Excelente / Otimizado' },
            ].map((opt) => (
              <div
                key={opt.val}
                className="flex items-center space-x-3 border p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleAnswer(opt.val.toString())}
              >
                <RadioGroupItem value={opt.val.toString()} id={`r${opt.val}`} />
                <Label htmlFor={`r${opt.val}`} className="flex-1 cursor-pointer font-medium">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/10 border-t pt-6">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0 || saving}>
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving}
            className="bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90"
          >
            {saving
              ? 'Finalizando...'
              : currentStep === questions.length - 1
                ? 'Concluir'
                : 'Próxima'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
