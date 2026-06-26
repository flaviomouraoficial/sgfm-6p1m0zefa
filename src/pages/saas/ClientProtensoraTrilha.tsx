import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, PlayCircle, CheckCircle, Lock, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function ClientProtensoraTrilha() {
  const { trilhaId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trilha, setTrilha] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [progressos, setProgressos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user || !trilhaId) return
      try {
        const t = await pb.collection('v1_protensora_trilhas').getOne(trilhaId)
        setTrilha(t)

        const mods = await pb
          .collection('v1_protensora_modulos')
          .getFullList({ filter: `trilha_id='${trilhaId}'`, sort: 'order' })
        setModulos(mods)

        if (mods.length > 0) {
          const filterStr = mods.map((m) => `modulo_id='${m.id}'`).join(' || ')
          const unis = await pb
            .collection('v1_protensora_unidades')
            .getFullList({ filter: filterStr, sort: 'ordem' })
          setUnidades(unis)
        }

        const progs = await pb
          .collection('v1_protensora_progresso_unidades')
          .getFullList({ filter: `participante_id='${user.id}'` })
        setProgressos(progs)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [trilhaId, user])

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Carregando trilha...</div>
  if (!trilha) return <div className="p-8 text-center">Trilha não encontrada.</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard/protensora')}
        className="mb-2 -ml-4 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Protensora
      </Button>

      <div className="flex items-center gap-4 border-b pb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
          style={{ backgroundColor: trilha.cor || '#1e3a8a', color: '#fff' }}
        >
          {trilha.icone || '📚'}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{trilha.name}</h1>
          <p className="text-muted-foreground">{trilha.description}</p>
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {modulos.map((m, mIndex) => {
          const modUnidades = unidades.filter((u) => u.modulo_id === m.id)
          return (
            <div key={m.id} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 text-blue-800 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {mIndex + 1}
                </div>
                <h2 className="text-xl font-bold">{m.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4 ml-11">{m.description}</p>

              <div className="ml-11 space-y-3">
                {modUnidades.map((u, uIndex) => {
                  const prog = progressos.find((p) => p.unidade_id === u.id)
                  const isCompleted = prog?.status === 'concluida'
                  const isAvailable = true

                  return (
                    <Card
                      key={u.id}
                      className={`transition-all ${isCompleted ? 'border-green-200 bg-green-50/30' : isAvailable ? 'hover:border-blue-300' : 'opacity-60 bg-slate-50'}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {isCompleted ? (
                            <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
                          ) : isAvailable ? (
                            <PlayCircle className="w-8 h-8 text-blue-500 shrink-0" />
                          ) : (
                            <Lock className="w-8 h-8 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              Aula {u.ordem ?? uIndex + 1}: {u.titulo}
                            </h3>
                            {u.descricao && (
                              <p className="text-sm text-slate-500 mt-1">{u.descricao}</p>
                            )}
                            <div className="text-xs font-medium text-amber-500 flex items-center gap-1 mt-2">
                              <Trophy className="w-3 h-3" /> Recompensa: {u.xp_conclusao || 200} XP
                            </div>
                          </div>
                        </div>
                        {isAvailable && (
                          <Button
                            asChild
                            variant={isCompleted ? 'outline' : 'default'}
                            className={!isCompleted ? 'bg-[#1e3a8a] hover:bg-[#1e3a8a]/90' : ''}
                          >
                            <Link to={`/dashboard/protensora/unidade/${u.id}`}>
                              {isCompleted ? 'Revisar' : 'Iniciar'}
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                {modUnidades.length === 0 && (
                  <p className="text-sm text-slate-400 italic">Nenhuma aula neste módulo ainda.</p>
                )}
              </div>
            </div>
          )
        })}
        {modulos.length === 0 && (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
            Nenhum módulo cadastrado nesta trilha.
          </div>
        )}
      </div>
    </div>
  )
}
