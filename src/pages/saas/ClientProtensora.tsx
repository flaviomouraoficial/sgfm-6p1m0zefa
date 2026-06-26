import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { BookOpen, Trophy, Star, CheckCircle, Footprints, Award, Zap, Shield } from 'lucide-react'

const IconsMap: Record<string, any> = { Trophy, Star, CheckCircle, Footprints, Award, Shield }

export default function ClientProtensora() {
  const { user } = useAuth()
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [participacoes, setParticipacoes] = useState<any[]>([])
  const [niveis, setNiveis] = useState<any[]>([])
  const [conquistas, setConquistas] = useState<any[]>([])
  const [myConquistas, setMyConquistas] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const [t, part, niv, allC, myC] = await Promise.all([
          pb
            .collection('v1_protensora_trilhas')
            .getFullList({ filter: 'active=true', sort: '-created' }),
          pb
            .collection('v1_protensora_participante_trilhas')
            .getFullList({ filter: `user_id='${user.id}'` }),
          pb.collection('v1_protensora_niveis').getFullList({ sort: 'nivel' }),
          pb.collection('v1_protensora_conquistas').getFullList({ sort: 'created' }),
          pb
            .collection('v1_protensora_conquistas_usuario')
            .getFullList({ filter: `user_id='${user.id}'` }),
        ])
        setTrilhas(t)
        setParticipacoes(part)
        setNiveis(niv)
        setConquistas(allC)
        setMyConquistas(myC)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [user])

  const totalScore = participacoes.reduce((sum, p) => sum + (p.xp_total || 0), 0)
  const totalStars = participacoes.reduce((sum, p) => sum + (p.estrelas || 0), 0)
  const totalEnergy =
    participacoes.reduce((sum, p) => sum + (p.energia || 100), 0) / (participacoes.length || 1)

  const currentLevelObj =
    niveis
      .slice()
      .reverse()
      .find((n) => totalScore >= n.xp_minimo) || niveis[0]
  const currentLevel = currentLevelObj?.nivel || 1
  const levelTitle = currentLevelObj?.titulo || 'Iniciante'
  const xpMin = currentLevelObj?.xp_minimo || 0
  const xpMax = currentLevelObj?.xp_maximo || 1000
  const progressPct = Math.min(100, Math.max(0, ((totalScore - xpMin) / (xpMax - xpMin)) * 100))

  return (
    <div className="space-y-8 pt-4">
      <div>
        <h2 className="text-3xl font-bold text-[#1e3a8a] tracking-tight">Gestão Protensora</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas trilhas de aprendizado, ganhe pontos e desbloqueie conquistas!
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-br from-[#1e3a8a] to-blue-700 text-white shadow-md border-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Shield className="w-48 h-48" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                  Nível {currentLevel}
                </p>
                <h3 className="text-2xl font-bold">{levelTitle}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">XP Total</p>
                <p className="text-2xl font-bold flex items-center gap-1 justify-end">
                  {totalScore} <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs opacity-80 font-medium">
                <span>{totalScore} XP</span>
                <span>
                  {xpMax} XP para o Nível {currentLevel + 1}
                </span>
              </div>
              <Progress
                value={progressPct}
                className="h-2.5 bg-white/20"
                indicatorClassName="bg-yellow-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-100 flex flex-col justify-center items-center p-4">
          <Zap className="w-10 h-10 text-amber-500 mb-2 fill-amber-500/20" />
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            Energia
          </p>
          <h4 className="text-3xl font-bold text-slate-800">{Math.round(totalEnergy)}%</h4>
        </Card>

        <Card className="shadow-sm border-blue-100 flex flex-col justify-center items-center p-4">
          <Star className="w-10 h-10 text-yellow-500 mb-2 fill-yellow-500/20" />
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            Estrelas
          </p>
          <h4 className="text-3xl font-bold text-slate-800">{totalStars}</h4>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Galeria de Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {conquistas.map((c) => {
              const earned = myConquistas.some((mc) => mc.conquista_id === c.id)
              const Icon = IconsMap[c.icon] || Award
              return (
                <div
                  key={c.id}
                  className={`flex flex-col items-center p-4 rounded-xl border min-w-[120px] transition-all ${earned ? 'border-amber-400 bg-amber-50/50 shadow-sm' : 'border-dashed opacity-50 grayscale'}`}
                >
                  <Icon
                    className={`w-8 h-8 mb-3 ${earned ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`}
                  />
                  <span className="text-xs font-bold text-center leading-tight text-foreground">
                    {c.name}
                  </span>
                </div>
              )
            })}
            {conquistas.length === 0 && (
              <div className="text-sm text-muted-foreground italic">
                Nenhuma conquista disponível no momento.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Trilhas de Aprendizado
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trilhas.map((t) => {
            const part = participacoes.find((p) => p.trilha_id === t.id)
            const nivelLocal = part?.nivel || 1
            const xpLocal = part?.xp_total || 0

            return (
              <Card
                key={t.id}
                className="hover:border-[#1e3a8a]/50 transition-all shadow-sm flex flex-col group overflow-hidden"
              >
                <div className="h-2 w-full" style={{ backgroundColor: t.cor || '#1e3a8a' }}></div>
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-4 right-4 opacity-10">
                    <BookOpen className="w-12 h-12" />
                  </div>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground relative z-10">
                    {t.icone && <span className="text-2xl">{t.icone}</span>}
                    {t.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col relative z-10">
                  <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-2">
                    {t.description || 'Trilha de desenvolvimento de gestão corporativa.'}
                  </p>
                  <div className="flex justify-between items-center mb-4 bg-slate-50 p-2 rounded-lg border">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Nível</p>
                      <p className="font-bold text-[#1e3a8a]">{nivelLocal}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-500">XP na Trilha</p>
                      <p className="font-bold text-amber-500 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500" /> {xpLocal}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/protensora/trilha/${t.id}`}
                    className="w-full text-center text-sm font-semibold text-white bg-[#1e3a8a] py-2.5 rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
                  >
                    Acessar Trilha &rarr;
                  </Link>
                </CardContent>
              </Card>
            )
          })}
          {trilhas.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p>Nenhuma trilha disponível no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
