import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { BookOpen } from 'lucide-react'

export default function ClientProtensora() {
  const { user } = useAuth()
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [progressos, setProgressos] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const t = await pb
          .collection('v1_protensora_trilhas')
          .getFullList({ filter: 'active=true', sort: '-created' })
        const p = await pb
          .collection('v1_protensora_progresso')
          .getFullList({ filter: `user_id='${user.id}'` })
        setTrilhas(t)
        setProgressos(p)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [user])

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h2 className="text-3xl font-bold text-[#1e3a8a] tracking-tight">Gestão Protensora</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas trilhas de aprendizado, módulos e desenvolva novas habilidades.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trilhas.map((t) => {
          const prog = progressos.find((p) => p.trilha_id === t.id)
          const pct = prog ? prog.percentage : 0
          return (
            <Card
              key={t.id}
              className="hover:border-[#1e3a8a]/50 transition-colors shadow-sm flex flex-col"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <BookOpen className="h-5 w-5 text-[#1e3a8a]" />
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
                <Progress value={pct} className="h-2 mb-5" />
                <Link
                  to={`/dashboard/protensora/trilha/${t.id}`}
                  className="text-sm font-semibold text-[#1e3a8a] hover:underline inline-flex items-center gap-1 w-fit bg-blue-50 px-3 py-1.5 rounded-full"
                >
                  {pct > 0 ? 'Continuar Trilha' : 'Iniciar Trilha'} &rarr;
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
  )
}
