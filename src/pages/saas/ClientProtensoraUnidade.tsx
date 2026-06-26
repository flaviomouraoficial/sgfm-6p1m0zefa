import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

export default function ClientProtensoraUnidade() {
  const { unidadeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [unidade, setUnidade] = useState<any>(null)
  const [questoes, setQuestoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'conteudo' | 'quiz' | 'resultado'>('conteudo')
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)

  useEffect(() => {
    async function load() {
      if (!unidadeId || !user) return
      try {
        const u = await pb.collection('v1_protensora_unidades').getOne(unidadeId)
        setUnidade(u)
        const q = await pb
          .collection('v1_protensora_questoes')
          .getFullList({ filter: `unidade_id='${unidadeId}'`, sort: 'order' })
        setQuestoes(q)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [unidadeId, user])

  const handleFinishQuiz = async () => {
    let corretas = 0
    let xpGained = unidade.xp_conclusao || 200

    questoes.forEach((q) => {
      if (respostas[q.id] === q.resposta_correta) {
        corretas++
        xpGained += q.xp_acerto || 50
      }
    })

    setScore(corretas)
    setStep('resultado')

    try {
      let prog
      try {
        prog = await pb
          .collection('v1_protensora_progresso_unidades')
          .getFirstListItem(`participante_id='${user.id}' && unidade_id='${unidade.id}'`)
      } catch {
        /* intentionally ignored */
      }

      const data = {
        participante_id: user.id,
        unidade_id: unidade.id,
        status: 'concluida',
        video_assistido: true,
        questoes_respondidas: questoes.length,
        questoes_acertadas: corretas,
        xp_ganho: xpGained,
        caminho: 'normal',
      }

      if (prog) {
        await pb.collection('v1_protensora_progresso_unidades').update(prog.id, data)
      } else {
        await pb.collection('v1_protensora_progresso_unidades').create(data)
      }

      toast({ title: 'Parabéns!', description: `Você concluiu a aula e ganhou ${xpGained} XP!` })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao salvar progresso', variant: 'destructive' })
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando aula...</div>
  if (!unidade) return <div className="p-8 text-center">Aula não encontrada.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-20">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-2 -ml-4 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      {step === 'conteudo' && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{unidade.titulo}</h1>
            <p className="text-muted-foreground mt-2">{unidade.descricao}</p>
          </div>

          {unidade.video_url && (
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center group cursor-pointer border-4 border-slate-900">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <Play className="w-20 h-20 text-white opacity-80 group-hover:scale-110 transition-transform group-hover:opacity-100 z-10" />
              <div className="absolute bottom-4 left-4 text-white font-medium z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Aula Gravada
              </div>
            </div>
          )}

          {unidade.texto_apoio && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Material de Apoio</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{ __html: unidade.texto_apoio }}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white px-8"
              onClick={() => setStep('quiz')}
            >
              Ir para o Quiz ({questoes.length} perguntas) &rarr;
            </Button>
          </div>
        </div>
      )}

      {step === 'quiz' && (
        <div className="space-y-6 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-800">Quiz de Fixação</h2>
          <p className="text-muted-foreground">
            Responda as questões abaixo para concluir a aula e ganhar XP.
          </p>

          {questoes.map((q, i) => (
            <Card key={q.id} className="shadow-sm">
              <CardHeader className="pb-3 bg-slate-50 border-b">
                <CardTitle className="text-base font-semibold flex gap-2">
                  <span className="text-[#1e3a8a]">{i + 1}.</span> {q.text}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RadioGroup
                  value={respostas[q.id]}
                  onValueChange={(v) => setRespostas({ ...respostas, [q.id]: v })}
                  className="space-y-3"
                >
                  {Array.isArray(q.alternativas) &&
                    q.alternativas.map((alt: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 transition-colors"
                      >
                        <RadioGroupItem
                          value={alt.id || idx.toString()}
                          id={`q${q.id}-alt${idx}`}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`q${q.id}-alt${idx}`}
                          className="font-normal cursor-pointer leading-relaxed flex-1"
                        >
                          {alt.texto || alt}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          {questoes.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed">
              Nenhuma questão cadastrada para esta aula.
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8"
              onClick={handleFinishQuiz}
            >
              Finalizar e Ganhar XP <CheckCircle2 className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 'resultado' && (
        <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-in-down py-10">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-4xl font-black text-slate-800">Aula Concluída!</h2>
          <p className="text-lg text-slate-600">
            Você acertou <strong>{score}</strong> de <strong>{questoes.length}</strong> questões.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 font-medium text-lg mt-8 flex flex-col items-center gap-2 shadow-sm">
            <span>Recompensa Total:</span>
            <span className="text-4xl font-black flex items-center gap-2">
              +{(unidade.xp_conclusao || 200) + score * (questoes[0]?.xp_acerto || 50)} XP
            </span>
          </div>

          <div className="pt-8">
            <Button size="lg" className="bg-[#1e3a8a] w-full" onClick={() => navigate(-1)}>
              Voltar para a Trilha
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
