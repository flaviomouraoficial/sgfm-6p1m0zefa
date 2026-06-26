import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { BookOpen, Trophy, Star, CheckCircle, Footprints, Award } from 'lucide-react'

const IconsMap: Record<string, any> = { Trophy, Star, CheckCircle, Footprints, Award }

export default function ClientProtensora() {
  const { user } = useAuth()
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [progressos, setProgressos] = useState<any[]>([])
  const [conquistas, setConquistas] = useState<any[]>([])
  const [myConquistas, setMyConquistas] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const [t, p, allC, myC] = await Promise.all([
          pb
            .collection('v1_protensora_trilhas')
            .getFullList({ filter: 'active=true', sort: '-created' }),
          pb.collection('v1_protensora_progresso').getFullList({ filter: `user_id='${user.id}'` }),
          pb.collection('v1_protensora_conquistas').getFullList({ sort: 'created' }),
          pb
            .collection('v1_protensora_conquistas_usuario')
            .getFullList({ filter: `user_id='${user.id}'` }),
        ])
        setTrilhas(t)
        setProgressos(p)
        setConquistas(allC)
        setMyConquistas(myC)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [user])

  const totalScore = progressos.reduce((sum, p) => sum + (p.score || 0), 0)

  return (
    <div className="space-y-8 pt-4">
      <div>
        <h2 className="text-3xl font-bold text-[#1e3a8a] tracking-tight">Gestão Protensora</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas trilhas de aprendizado, ganhe pontos e desbloqueie conquistas!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-gradient-to-br from-[#1e3a8a] to-blue-700 text-white shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-90">Pontuação Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold flex items-center gap-3">
              <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 drop-shadow-md" />
              {totalScore} <span className="text-xl font-normal opacity-80">pts</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#1e3a8a]" />
              Minhas Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {conquistas.map((c) => {
                const earned = myConquistas.some((mc) => mc.conquista_id === c.id)
                const Icon = IconsMap[c.icon] || Award
                return (
                  <div
                    key={c.id}
                    className={`flex flex-col items-center p-4 rounded-xl border min-w-[120px] transition-all ${earned ? 'border-yellow-400 bg-yellow-50/50 shadow-sm' : 'border-dashed opacity-50 grayscale'}`}
                  >
                    <Icon
                      className={`w-8 h-8 mb-3 ${earned ? 'text-yellow-500 fill-yellow-500/20' : 'text-slate-400'}`}
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
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Trilhas Disponíveis
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trilhas.map((t) => {
            const prog = progressos.find((p) => p.trilha_id === t.id)
            const pct = prog ? prog.percentage : 0

            let barColor = 'bg-blue-600'
            if (pct >= 100) barColor = 'bg-green-500'
            else if (pct > 0) barColor = 'bg-yellow-500'

            return (
              <Card
                key={t.id}
                className="hover:border-[#1e3a8a]/50 transition-colors shadow-sm flex flex-col group"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <BookOpen className="h-5 w-5 text-[#1e3a8a] group-hover:scale-110 transition-transform" />
                    {t.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    {t.description || 'Trilha de desenvolvimento de gestão corporativa.'}
                  </p>
                  <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-600">
                    <span>Meu Progresso</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-2 mb-5" indicatorClassName={barColor} />
                  <Link
                    to={`/dashboard/protensora/trilha/${t.id}`}
                    className="text-sm font-semibold text-[#1e3a8a] hover:underline inline-flex items-center gap-1 w-fit bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {pct > 0
                      ? pct >= 100
                        ? 'Revisar Trilha'
                        : 'Continuar Trilha'
                      : 'Iniciar Trilha'}{' '}
                    &rarr;
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
