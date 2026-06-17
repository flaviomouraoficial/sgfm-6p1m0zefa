import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [respondentLevel, setRespondentLevel] = useState<string>('')
  const [is360Setup, setIs360Setup] = useState(false)

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

        if (type === 'strategic_360') {
          setIs360Setup(true)
        }

        const qs = await pb.collection('v1_saas_questions').getFullList({
          filter: `diagnostic="${res.diagnostic}"`,
          sort: 'order',
        })

        if (qs.length === 0) {
          toast({
            title: 'Modelo Vazio',
            description: 'Este diagnóstico ainda não possui questões cadastradas.',
            variant: 'destructive',
          })
          navigate('/dashboard')
          return
        }

        setQuestions(qs)
        const dims = Array.from(new Set(qs.map((q) => q.dimension)))
        setDimensions(dims)

        if (res.result_json && res.result_json.answers) {
          setAnswers(res.result_json.answers)
          if (res.result_json.respondentLevel) {
            setRespondentLevel(res.result_json.respondentLevel)
            setIs360Setup(false)
          }
        }
      } catch (err) {
        console.error(err)
        navigate('/dashboard')
      }
    }
    fetchResult()
  }, [id, navigate, toast])

  const handleAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentStep].id]: parseInt(val) }))
  }

  const saveProgress = async (newAnswers: Record<string, number>) => {
    try {
      await pb.collection('v1_saas_results').update(id!, {
        result_json: { ...result?.result_json, answers: newAnswers, respondentLevel },
      })
    } catch (err) {
      console.error('Failed to save progress', err)
    }
  }

  const start360 = async () => {
    if (!respondentLevel) {
      toast({
        title: 'Atenção',
        description: 'Selecione o nível do respondente.',
        variant: 'destructive',
      })
      return
    }
    setIs360Setup(false)
    await pb.collection('v1_saas_results').update(id!, {
      result_json: { ...result?.result_json, respondentLevel },
    })
  }

  const handleNext = async () => {
    if (answers[questions[currentStep].id] === undefined) {
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
      const type = result.type || result.expand?.diagnostic?.type || 'gestao'
      const scaleMax = type === 'gestao' ? 3 : 10

      const scores: Record<string, number> = {}
      dimensions.forEach((dim) => {
        const dimQs = questions.filter((q) => q.dimension === dim)
        const sum = dimQs.reduce((acc, q) => acc + (answers[q.id] || 0), 0)
        scores[dim] = (sum / (dimQs.length * scaleMax)) * 10
      })

      const overall = Object.values(scores).reduce((a, b) => a + b, 0) / dimensions.length

      let classification = 'Crise'
      if (overall >= 9) classification = 'Excelência'
      else if (overall >= 8) classification = 'Potencial'
      else if (overall >= 6) classification = 'Atenção'
      else if (overall >= 4) classification = 'Risco'

      const finalJson = {
        answers,
        scores,
        overall,
        classification,
        respondentLevel,
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
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando questionário...
      </div>
    )

  if (is360Setup) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 border rounded-xl shadow-lg bg-card">
        <h2 className="text-2xl font-bold mb-4 text-[#1e3a8a]">Configuração 360°</h2>
        <p className="text-muted-foreground mb-6">
          Como este é um modelo de avaliação 360°, indique qual o seu nível de atuação na
          organização em relação ao avaliado (ou o seu próprio nível, caso seja autoavaliação).
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nível do Respondente</Label>
            <Select value={respondentLevel} onValueChange={setRespondentLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Estratégico">Estratégico (Diretoria/C-Level)</SelectItem>
                <SelectItem value="Tático">Tático (Gerência/Coordenação)</SelectItem>
                <SelectItem value="Operacional">Operacional (Analistas/Assistentes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full mt-4" size="lg" onClick={start360}>
            Iniciar Diagnóstico
          </Button>
        </div>
      </div>
    )
  }

  const q = questions[currentStep]
  const progress = (currentStep / questions.length) * 100
  const type = result.type || result.expand?.diagnostic?.type || 'gestao'

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
    <div className="max-w-4xl mx-auto space-y-6 pt-8 pb-12 px-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>Progresso da Avaliação</span>
          <span>
            {currentStep + 1} de {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2 border-[#1e3a8a]/20 shadow-md">
        <CardHeader className="bg-muted/30 border-b pb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-[#1e3a8a] uppercase tracking-wider">
              {q.dimension}
            </p>
            {respondentLevel && (
              <span className="text-xs font-semibold bg-[#1e3a8a]/10 text-[#1e3a8a] px-3 py-1 rounded-full">
                Perfil: {respondentLevel}
              </span>
            )}
          </div>
          <CardTitle className="text-2xl leading-relaxed">{q.text}</CardTitle>
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
                className={`flex ${type === 'gestao' ? 'items-center space-x-3 p-4' : 'flex-col items-center justify-center p-2 text-center h-24'} border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${answers[q.id] === opt.val ? 'border-[#1e3a8a] bg-[#1e3a8a]/5 shadow-sm' : 'border-border'}`}
                onClick={() => handleAnswer(opt.val.toString())}
              >
                <RadioGroupItem
                  value={opt.val.toString()}
                  id={`r${opt.val}`}
                  className={type === 'gestao' ? '' : 'mb-2'}
                />
                <Label
                  htmlFor={`r${opt.val}`}
                  className={`cursor-pointer font-medium ${type === 'gestao' ? 'flex-1 text-base' : 'text-xs leading-tight'}`}
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-4 bg-muted/10 border-t pt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0 || saving}
            className="w-full sm:w-auto"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving}
            className="w-full sm:w-auto bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90"
          >
            {saving
              ? 'Finalizando...'
              : currentStep === questions.length - 1
                ? 'Concluir Avaliação'
                : 'Próxima Questão'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
