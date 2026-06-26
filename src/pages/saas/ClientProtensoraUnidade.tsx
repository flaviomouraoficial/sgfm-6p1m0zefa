import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
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
  const [videoAssistido, setVideoAssistido] = useState(false)

  const [serverResults, setServerResults] = useState<any[]>([])
  const [caminhoData, setCaminhoData] = useState<{ tipo: string; dados: any[] } | null>(null)
  const [xpGanho, setXpGanho] = useState(0)

  async function load() {
    if (!unidadeId || !user?.id) return
    try {
      const u = await pb
        .collection('v1_protensora_unidades')
        .getOne(unidadeId, { expand: 'modulo_id' })

      if (!u.video_url) setVideoAssistido(true)

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
        if (p.video_assistido) setVideoAssistido(true)
        if (p.status === 'concluida') {
          setScore(p.questoes_acertadas || 0)
          setXpGanho(p.xp_ganho || 0)

          if (p.caminho === 'reforco') {
            const r = await pb
              .collection('v1_protensora_reforco')
              .getFullList({ filter: `unidade_id='${unidadeId}'` })
            setCaminhoData({ tipo: 'reforco', dados: r })
          } else if (p.caminho === 'avanco') {
            const a = await pb
              .collection('v1_protensora_avanco')
              .getFullList({ filter: `unidade_origem_id='${unidadeId}'` })
            setCaminhoData({ tipo: 'avanco', dados: a })
          }
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

  const handleFinishQuiz = async () => {
    if (!pb.authStore.isValid || !user?.id) {
      toast({
        title: 'Sessão Expirada',
        description: 'Por favor, atualize a página.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await pb.send('/backend/v1/protensora/submit-unidade', {
        method: 'POST',
        body: JSON.stringify({
          unidade_id: unidadeId,
          respostas,
        }),
      })

      setScore(res.corretas)
      setXpGanho(res.xpGanho)
      setServerResults(res.results || [])

      let newCaminho = null
      if (res.caminho === 'reforco') {
        const r = await pb
          .collection('v1_protensora_reforco')
          .getFullList({ filter: `unidade_id='${unidadeId}'` })
        newCaminho = { tipo: 'reforco', dados: r }
      } else if (res.caminho === 'avanco') {
        const a = await pb
          .collection('v1_protensora_avanco')
          .getFullList({ filter: `unidade_origem_id='${unidadeId}'` })
        newCaminho = { tipo: 'avanco', dados: a }
      }
      setCaminhoData(newCaminho)

      setStep('resultado')
      toast({
        title: 'Parabéns!',
        description: `Você concluiu a aula e ganhou ${res.xpGanho} XP!`,
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

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  if (!unidade)
    return <div className="p-8 text-center text-muted-foreground">Aula não encontrada.</div>

  const isConcluida = progresso?.status === 'concluida' || serverResults.length > 0

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
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center group border-4 border-slate-900">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
              <iframe
                src={
                  unidade.video_url.includes('youtube')
                    ? unidade.video_url.replace('watch?v=', 'embed/')
                    : unidade.video_url
                }
                className="w-full h-full"
                allowFullScreen
                onLoad={() => setVideoAssistido(true)}
              ></iframe>
            </div>
          )}

          {unidade.video_url && !isConcluida && (
            <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-medium">
                  Assista ao vídeo para liberar o Quiz
                </p>
              </div>
              <Button
                variant={videoAssistido ? 'default' : 'outline'}
                className={videoAssistido ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                onClick={() => setVideoAssistido(true)}
              >
                {videoAssistido ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Assistido
                  </>
                ) : (
                  'Marcar como Assistido'
                )}
              </Button>
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
            {isConcluida ? (
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
                disabled={!videoAssistido}
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
            Responda as questões abaixo para concluir a aula e ganhar XP. Custará 10 de Energia.
          </p>

          {questoes.map((q, i) => {
            const serverRes = serverResults.find((sr) => sr.questao_id === q.id)
            const isCorrect = serverRes?.is_correct
            const correctText = serverRes?.resposta_correta
            const explanation = serverRes?.explicacao

            return (
              <Card key={q.id} className="shadow-sm">
                <CardHeader className="pb-3 bg-slate-50 border-b">
                  <CardTitle className="text-base font-semibold flex gap-2">
                    <span className="text-[#1e3a8a]">{i + 1}.</span> {q.text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <RadioGroup
                    value={respostas[q.id]}
                    onValueChange={(v) => !isConcluida && setRespostas({ ...respostas, [q.id]: v })}
                    disabled={isConcluida || saving}
                    className="space-y-3"
                  >
                    {Array.isArray(q.alternativas) &&
                      q.alternativas.map((alt: any, idx: number) => {
                        const altId = String(alt?.id ?? idx.toString())
                        const altTexto = typeof alt === 'string' ? alt : alt?.texto || altId
                        const isSelected = String(respostas[q.id]) === altId

                        let bgClass = isSelected
                          ? 'border-[#1e3a8a] bg-blue-50'
                          : 'border-transparent hover:bg-slate-50'

                        if (isConcluida && serverRes) {
                          const isCorrectChoice = altId.trim() === correctText?.trim()
                          if (isCorrectChoice)
                            bgClass = 'border-green-500 bg-green-50 text-green-900 font-bold'
                          else if (isSelected && !isCorrectChoice)
                            bgClass = 'border-red-500 bg-red-50 text-red-900'
                          else bgClass = 'border-transparent opacity-50'
                        }

                        return (
                          <div
                            key={altId}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${bgClass}`}
                            onClick={() => {
                              if (!isConcluida && !saving)
                                setRespostas({ ...respostas, [q.id]: altId })
                            }}
                          >
                            <RadioGroupItem
                              value={altId}
                              id={`q${q.id}-alt${altId}`}
                              className="mt-0.5"
                              disabled={isConcluida || saving}
                            />
                            <Label
                              htmlFor={`q${q.id}-alt${altId}`}
                              className={`font-normal leading-relaxed flex-1 ${isConcluida ? '' : 'cursor-pointer'}`}
                            >
                              {altTexto}
                            </Label>
                          </div>
                        )
                      })}
                  </RadioGroup>

                  {isConcluida && serverRes && (
                    <div
                      className={`mt-4 p-4 rounded-lg border ${isCorrect ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}
                    >
                      <p className="font-bold text-sm mb-1">
                        {isCorrect ? '✅ Correto!' : '❌ Incorreto!'}
                      </p>
                      {explanation && (
                        <p className="text-sm mt-2">
                          <span className="font-semibold">Explicação:</span> {explanation}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {questoes.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed text-slate-500">
              Nenhuma questão cadastrada para esta aula.
            </div>
          )}

          <div className="flex justify-end pt-4">
            {isConcluida ? (
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
                  'Avaliando Respostas...'
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Finalizar e Avaliar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'resultado' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-down py-10">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-4xl font-black text-slate-800">Aula Concluída!</h2>
            <p className="text-lg text-slate-600 mt-2">
              Você acertou <strong>{score}</strong> de <strong>{questoes.length}</strong> questões.
            </p>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 font-medium text-lg mt-6 flex flex-col items-center gap-2 shadow-sm">
              <span>Recompensa Total:</span>
              <span className="text-4xl font-black flex items-center gap-2 text-amber-600">
                +{xpGanho} XP
              </span>
            </div>
          </div>

          {caminhoData?.tipo === 'reforco' && caminhoData.dados.length > 0 && (
            <Card className="border-red-200 bg-red-50/50 shadow-sm mt-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Material de Reforço
                </CardTitle>
                <p className="text-sm text-red-700">
                  Seu desempenho foi abaixo de 50%. Sugerimos revisar este material antes de
                  prosseguir.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {caminhoData.dados.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-lg border border-red-100">
                    <h4 className="font-bold text-slate-800 mb-2">{item.titulo}</h4>
                    <div
                      className="prose prose-sm max-w-none text-slate-600"
                      dangerouslySetInnerHTML={{ __html: item.texto }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {caminhoData?.tipo === 'avanco' && caminhoData.dados.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50 shadow-sm mt-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Desafio de Avanço
                </CardTitle>
                <p className="text-sm text-blue-700">
                  Excelente desempenho! Separamos um conteúdo avançado para você.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {caminhoData.dados.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{item.titulo}</h4>
                      {item.xp_bonus > 0 && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          +{item.xp_bonus} XP Bônus
                        </span>
                      )}
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-slate-600"
                      dangerouslySetInnerHTML={{ __html: item.texto }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="pt-8 flex flex-col md:flex-row gap-4">
            <Button
              size="lg"
              variant="outline"
              className="w-full md:w-1/2"
              onClick={() => {
                const trilhaId = unidade.expand?.modulo_id?.trilha_id || unidade.trilha_id
                navigate(
                  trilhaId ? `/dashboard/protensora/trilha/${trilhaId}` : '/dashboard/protensora',
                )
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
                  setVideoAssistido(false)
                  setServerResults([])
                  setProgresso(null)
                  setRespostas({})
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
                  navigate(
                    trilhaId ? `/dashboard/protensora/trilha/${trilhaId}` : '/dashboard/protensora',
                  )
                }}
              >
                Concluir Módulo
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
