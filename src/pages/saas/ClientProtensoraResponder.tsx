import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

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

  useEffect(() => {
    async function load() {
      if (!moduloId || !user) return
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

        const nextIndex = q.findIndex((quest) => !r.some((resp) => resp.questao_id === quest.id))
        setCurrentStep(nextIndex === -1 ? q.length - 1 : nextIndex)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [moduloId, user])

  const handleNext = async () => {
    if (!currentAnswer.trim()) {
      toast({
        title: 'Resposta em branco',
        description: 'Por favor, insira uma resposta válida.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const q = questoes[currentStep]
      const existing = respostas.find((r) => r.questao_id === q.id)

      const payload = {
        user_id: user?.id,
        questao_id: q.id,
        modulo_id: moduloId,
        trilha_id: modulo?.trilha_id,
        answer_value: { value: currentAnswer },
        score: q.weight || 1,
      }

      if (existing) {
        await pb.collection('v1_protensora_respostas').update(existing.id, payload)
      } else {
        await pb.collection('v1_protensora_respostas').create(payload)
      }

      if (currentStep < questoes.length - 1) {
        setCurrentStep((s) => s + 1)
        setCurrentAnswer('')
      } else {
        toast({ title: 'Módulo concluído!', description: 'Seu progresso foi salvo com sucesso.' })
        navigate(`/dashboard/protensora/trilha/${modulo.trilha_id}`)
      }
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
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
    <div className="max-w-3xl mx-auto space-y-6 pt-6">
      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
        <Button variant="ghost" asChild className="-ml-4">
          <Link to={`/dashboard/protensora/trilha/${modulo?.trilha_id}`}>
            &larr; Sair do Módulo
          </Link>
        </Button>
        <span className="bg-muted px-3 py-1 rounded-full">
          Questão {currentStep + 1} de {questoes.length}
        </span>
      </div>
      <Progress value={pct} className="h-2" />

      <Card className="border-2 border-[#1e3a8a]/10 shadow-md">
        <CardHeader className="bg-muted/20 border-b pb-5">
          <CardTitle className="text-xl leading-relaxed text-foreground">{q.text}</CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          {q.type === 'text' ? (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Sua Resposta</Label>
              <Input
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                className="h-12 text-base"
              />
            </div>
          ) : (
            <RadioGroup
              key={q.id}
              value={currentAnswer}
              onValueChange={setCurrentAnswer}
              className="space-y-3"
            >
              {q.options?.choices?.map((c: string) => (
                <div
                  key={c}
                  className={`flex items-center space-x-3 border-2 p-4 rounded-xl cursor-pointer transition-colors ${currentAnswer === c ? 'border-[#1e3a8a] bg-blue-50/50' : 'border-border hover:bg-muted'}`}
                  onClick={() => setCurrentAnswer(c)}
                >
                  <RadioGroupItem value={c} id={c} />
                  <Label htmlFor={c} className="cursor-pointer text-base w-full font-medium">
                    {c}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10 pt-4 flex justify-end border-t">
          <Button
            onClick={handleNext}
            disabled={saving}
            className="bg-[#1e3a8a] text-white px-8 h-11 text-base"
          >
            {saving
              ? 'Salvando...'
              : currentStep === questoes.length - 1
                ? 'Finalizar Módulo'
                : 'Próxima Questão'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
