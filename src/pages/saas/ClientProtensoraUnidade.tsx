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
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'

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
  const [progresso, setProgresso] = useState<any>(null)
  const [nextUnidadeId, setNextUnidadeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!unidadeId || !user) return
    try {
      const u = await pb
        .collection('v1_protensora_unidades')
        .getOne(unidadeId, { expand: 'modulo_id' })

      const tId = u.expand?.modulo_id?.trilha_id || u.trilha_id
      if (tId) {
        const mods = await pb
          .collection('v1_protensora_modulos')
          .getFullList({ filter: `trilha_id='${tId}'`, sort: 'order' })
        if (mods.length > 0) {
          const filterStr = mods.map((m) => `modulo_id='${m.id}'`).join(' || ')
          const unis = await pb
            .collection('v1_protensora_unidades')
            .getFullList({ filter: filterStr, sort: 'ordem' })
          const sortedUnis = unis.sort((a, b) => {
            const modA = mods.find((m) => m.id === a.modulo_id)
            const modB = mods.find((m) => m.id === b.modulo_id)
            if (modA?.order !== modB?.order) return (modA?.order || 0) - (modB?.order || 0)
            return (a.ordem || 0) - (b.ordem || 0)
          })
          const currentIndex = sortedUnis.findIndex((uni) => uni.id === unidadeId)
          if (currentIndex >= 0 && currentIndex < sortedUnis.length - 1) {
            setNextUnidadeId(sortedUnis[currentIndex + 1].id)
          } else {
            setNextUnidadeId(null)
          }
        }
      }
      setUnidade(u)
      const q = await pb
        .collection('v1_protensora_questoes')
        .getFullList({ filter: `unidade_id='${unidadeId}'`, sort: 'order' })
      setQuestoes(q)

      try {
        const p = await pb
          .collection('v1_protensora_progresso_unidades')
          .getFirstListItem(`participante_id='${user.id}' && unidade_id='${unidadeId}'`)
        setProgresso(p)
        if (p.status === 'concluida') {
          setScore(p.questoes_acertadas || 0)
        }
      } catch {
        // No progress yet
      }

      try {
        const r = await pb
          .collection('v1_protensora_respostas')
          .getFullList({ filter: `user_id='${user.id}' && modulo_id='${u.modulo_id}'` })
        const resps: Record<string, string> = {}
        for (const resp of r) {
          if (q.find((quest) => quest.id === resp.questao_id)) {
            resps[resp.questao_id] = resp.answer_value?.value || ''
          }
        }
        setRespostas(resps)
      } catch {
        // Ignored if missing responses
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [unidadeId, user])

  useRealtime('v1_protensora_progresso_unidades', (e) => {
    if (e.record.participante_id === user?.id && e.record.unidade_id === unidadeId) {
      load()
    }
  })

  const handleFinishQuiz = async () => {
    setSaving(true)
    let corretas = 0
    let questoesXp = 0
    let xpGained = unidade.xp_conclusao || 200

    try {
      for (const q of questoes) {
        const ansValue = respostas[q.id]
        if (ansValue !== undefined) {
          let existing
          try {
            existing = await pb
              .collection('v1_protensora_respostas')
              .getFirstListItem(`user_id='${user?.id}' && questao_id='${q.id}'`)
          } catch (err: any) {
            if (err.status !== 404)
              throw new Error('Falha de rede ao verificar respostas. Tente novamente.')
          }

          if (existing) {
            await pb.collection('v1_protensora_respostas').update(existing.id, {
              answer_value: { value: ansValue },
            })
          } else {
            const moduloId = unidade.expand?.modulo_id?.id || unidade.modulo_id
            let trilhaId = unidade.expand?.modulo_id?.trilha_id
            if (!trilhaId) {
              const m = await pb.collection('v1_protensora_modulos').getOne(moduloId)
              trilhaId = m.trilha_id
            }

            await pb.collection('v1_protensora_respostas').create({
              user_id: user?.id,
              questao_id: q.id,
              modulo_id: moduloId,
              trilha_id: trilhaId,
              answer_value: { value: ansValue },
            })
          }

          if (String(ansValue).trim() === String(q.resposta_correta).trim()) {
            corretas++
            questoesXp += q.xp_acerto || q.weight || 50
          }
        }
      }

      setScore(corretas)

      let prog
      try {
        prog = await pb
          .collection('v1_protensora_progresso_unidades')
          .getFirstListItem(`participante_id='${user?.id}' && unidade_id='${unidade.id}'`)
      } catch (err: any) {
        if (err.status !== 404) throw new Error('Falha de rede ao verificar progresso da unidade.')
      }

      const progData = {
        participante_id: user?.id,
        unidade_id: unidade.id,
        status: 'concluida',
        video_assistido: true,
        questoes_respondidas: questoes.length,
        questoes_acertadas: corretas,
        xp_ganho: xpGained,
        caminho: 'normal',
      }

      if (prog) {
        await pb.collection('v1_protensora_progresso_unidades').update(prog.id, progData)
      } else {
        await pb.collection('v1_protensora_progresso_unidades').create(progData)
      }

      const trilhaId =
        unidade.expand?.modulo_id?.trilha_id ||
        (await pb.collection('v1_protensora_modulos').getOne(unidade.modulo_id)).trilha_id
      let trailProg
      try {
        trailProg = await pb
          .collection('v1_protensora_progresso')
          .getFirstListItem(`user_id='${user?.id}' && trilha_id='${trilhaId}'`)
      } catch (err: any) {
        if (err.status !== 404) throw new Error('Falha de rede ao verificar progresso da trilha.')
      }

      if (trailProg) {
        await pb.collection('v1_protensora_progresso').update(trailProg.id, {
          score: (trailProg.score || 0) + xpGained + questoesXp,
        })
      } else {
        await pb.collection('v1_protensora_progresso').create({
          user_id: user?.id,
          trilha_id: trilhaId,
          score: xpGained + questoesXp,
          percentage: 0,
        })
      }

      setStep('resultado')
      toast({
        title: 'Parabéns!',
        description: `Você concluiu a aula e ganhou ${xpGained + questoesXp} XP no total!`,
      })
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar progresso',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
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
            {progresso?.status === 'concluida' ? (
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                onClick={() => setStep('resultado')}
              >
                Ver Resultado &rarr;
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white px-8"
                onClick={() => setStep('quiz')}
              >
                Ir para o Quiz ({questoes.length} perguntas) &rarr;
              </Button>
            )}
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
                  onValueChange={(v) =>
                    !progresso?.status || progresso.status !== 'concluida'
                      ? setRespostas({ ...respostas, [q.id]: v })
                      : undefined
                  }
                  disabled={progresso?.status === 'concluida' || saving}
                  className="space-y-3"
                >
                  {Array.isArray(q.alternativas) &&
                    q.alternativas.map((alt: any, idx: number) => {
                      const isSelected = respostas[q.id] === (alt.id || idx.toString())
                      const isConcluida = progresso?.status === 'concluida'
                      let bgClass = isSelected
                        ? 'border-[#1e3a8a] bg-blue-50'
                        : 'border-transparent hover:bg-slate-50'

                      if (isConcluida) {
                        const isCorrect =
                          String(alt.id || idx.toString()).trim() ===
                          String(q.resposta_correta).trim()
                        if (isCorrect) bgClass = 'border-green-500 bg-green-50 text-green-900'
                        else if (isSelected && !isCorrect)
                          bgClass = 'border-red-500 bg-red-50 text-red-900'
                        else bgClass = 'border-transparent opacity-50'
                      }

                      return (
                        <div
                          key={idx}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${bgClass}`}
                        >
                          <RadioGroupItem
                            value={alt.id || idx.toString()}
                            id={`q${q.id}-alt${idx}`}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={`q${q.id}-alt${idx}`}
                            className={`font-normal leading-relaxed flex-1 ${isConcluida ? '' : 'cursor-pointer'}`}
                          >
                            {alt.texto || alt}
                          </Label>
                        </div>
                      )
                    })}
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
            {progresso?.status === 'concluida' ? (
              <Button
                size="lg"
                className="bg-[#1e3a8a] text-white px-8"
                onClick={() => setStep('resultado')}
              >
                Ver Resultado
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                onClick={handleFinishQuiz}
                disabled={saving || Object.keys(respostas).length < questoes.length}
              >
                {saving ? (
                  'Verificando...'
                ) : (
                  <>
                    <>
                      Finalizar e Ganhar XP <CheckCircle2 className="w-5 h-5 ml-2" />
                    </>
                  </>
                )}
              </Button>
            )}
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

          <div className="pt-8 flex flex-col md:flex-row gap-4">
            <Button
              size="lg"
              variant="outline"
              className="w-full md:w-1/2"
              onClick={() => {
                const trilhaId = unidade.expand?.modulo_id?.trilha_id || unidade.trilha_id
                if (trilhaId) navigate(`/dashboard/protensora/trilha/${trilhaId}`)
                else navigate('/dashboard/protensora')
              }}
            >
              Voltar para a Trilha
            </Button>
            {nextUnidadeId ? (
              <Button
                size="lg"
                className="bg-[#1e3a8a] w-full md:w-1/2"
                onClick={() => {
                  setStep('conteudo')
                  navigate(`/dashboard/protensora/unidade/${nextUnidadeId}`)
                }}
              >
                Avançar para Próxima Aula &rarr;
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-[#1e3a8a] w-full md:w-1/2"
                onClick={() => {
                  const trilhaId = unidade.expand?.modulo_id?.trilha_id || unidade.trilha_id
                  if (trilhaId) navigate(`/dashboard/protensora/trilha/${trilhaId}`)
                  else navigate('/dashboard/protensora')
                }}
              >
                Concluir Trilha
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
