import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  BookOpen,
  Trophy,
  Star,
  CheckCircle,
  Footprints,
  Award,
  Zap,
  Shield,
  FileText,
  Download,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const IconsMap: Record<string, any> = { Trophy, Star, CheckCircle, Footprints, Award, Shield }

export default function ClientProtensora() {
  const { user } = useAuth()
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [participacoes, setParticipacoes] = useState<any[]>([])
  const [niveis, setNiveis] = useState<any[]>([])
  const [conquistas, setConquistas] = useState<any[]>([])
  const [myConquistas, setMyConquistas] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [certificados, setCertificados] = useState<any[]>([])

  useRealtime(
    'v1_protensora_participante_trilhas',
    (e) => {
      if (e.action === 'create' || e.action === 'update') {
        setParticipacoes((prev) => {
          const idx = prev.findIndex((p) => p.id === e.record.id)
          if (idx >= 0) {
            const newArr = [...prev]
            newArr[idx] = e.record
            return newArr
          }
          return [...prev, e.record]
        })
      }
    },
    !!user,
  )

  useRealtime(
    'v1_protensora_conquistas_usuario',
    (e) => {
      if (e.action === 'create') {
        setMyConquistas((prev) => [...prev, e.record])
      }
    },
    !!user,
  )

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
          pb
            .collection('v1_protensora_certificados')
            .getFullList({ filter: `user_id='${user.id}'`, expand: 'trilha_id' }),
        ])
        setTrilhas(t)
        setParticipacoes(part)
        setNiveis(niv)
        setConquistas(allC)
        setMyConquistas(myC)
        setCertificados(certs)

        pb.send('/backend/v1/protensora/ranking', { method: 'GET' })
          .then((res) => setRanking(res.items || []))
          .catch(console.error)
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
            {conquistas
              .filter((c) => myConquistas.some((mc) => mc.conquista_id === c.id))
              .map((c) => {
                const Icon = IconsMap[c.icon] || Award
                return (
                  <div
                    key={c.id}
                    className="flex flex-col items-center p-4 rounded-xl border min-w-[120px] transition-all border-amber-400 bg-amber-50/50 shadow-sm"
                  >
                    <Icon className="w-8 h-8 mb-3 text-amber-500 fill-amber-500/20" />
                    <span className="text-xs font-bold text-center leading-tight text-foreground">
                      {c.name}
                    </span>
                  </div>
                )
              })}
            {conquistas.filter((c) => myConquistas.some((mc) => mc.conquista_id === c.id))
              .length === 0 && (
              <div className="text-sm text-muted-foreground italic">
                Você ainda não desbloqueou nenhuma conquista.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trilhas" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1 border">
          <TabsTrigger value="trilhas">Minhas Trilhas</TabsTrigger>
          <TabsTrigger value="ranking">Ranking Global</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
        </TabsList>

        <TabsContent value="trilhas" className="space-y-4 animate-in fade-in-50">
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
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          XP na Trilha
                        </p>
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
        </TabsContent>

        <TabsContent value="ranking" className="animate-in fade-in-50">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Ranking Global</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Pos</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Nível Mín</TableHead>
                    <TableHead className="text-right pr-6">XP Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      className={r.id === user?.id ? 'bg-blue-50/50 font-medium' : ''}
                    >
                      <TableCell className="text-center font-bold text-lg">
                        {idx === 0 ? (
                          '🥇'
                        ) : idx === 1 ? (
                          '🥈'
                        ) : idx === 2 ? (
                          '🥉'
                        ) : (
                          <span className="text-sm text-slate-500">{idx + 1}º</span>
                        )}
                      </TableCell>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border shadow-sm">
                          <AvatarImage
                            src={
                              r.avatar
                                ? pb.files.getURL(
                                    { id: r.id, collectionId: r.collectionId } as any,
                                    r.avatar,
                                  )
                                : undefined
                            }
                          />
                          <AvatarFallback className="bg-[#1e3a8a] text-white text-xs">
                            {r.name?.substring(0, 2).toUpperCase() || 'AL'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">{r.name}</p>
                          {r.id === user?.id && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Você
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{r.nivel_max}</TableCell>
                      <TableCell className="text-right pr-6 text-amber-600 font-bold">
                        {r.xp_total} XP
                      </TableCell>
                    </TableRow>
                  ))}
                  {ranking.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum dado de ranking disponível.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificados" className="animate-in fade-in-50">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certificados.map((c) => (
              <Card
                key={c.id}
                className="overflow-hidden border-2 hover:border-[#1e3a8a]/30 transition-colors"
              >
                <div className="h-3 bg-gradient-to-r from-[#1e3a8a] to-blue-500 w-full" />
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <FileText className="w-14 h-14 text-[#1e3a8a] mb-4 drop-shadow-sm" />
                  <h4 className="font-bold text-lg mb-1 line-clamp-1">
                    {c.expand?.trilha_id?.name || 'Trilha'}
                  </h4>
                  <p className="text-sm font-medium text-amber-600 mb-5">
                    Nota Final: {Math.round(c.final_score)}%
                  </p>
                  <Button
                    variant="outline"
                    className="w-full flex gap-2 border-[#1e3a8a]/20 hover:bg-[#1e3a8a]/5"
                    asChild
                  >
                    <a
                      href={pb.files.getURL(c, c.certificate_file)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="w-4 h-4" /> Baixar Certificado
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {certificados.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">Nenhum certificado emitido ainda.</p>
                <p className="text-sm mt-1">
                  Complete as trilhas com a pontuação mínima para ganhar o seu!
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
