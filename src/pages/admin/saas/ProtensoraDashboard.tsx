import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { BookOpen, Users, CheckCircle, Trophy, Star } from 'lucide-react'

export default function ProtensoraDashboard() {
  const [stats, setStats] = useState({ trilhas: 0, users: 0, completions: 0 })
  const [ranking, setRanking] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const t = await pb
          .collection('v1_protensora_trilhas')
          .getList(1, 1, { filter: 'active=true' })
        const u = await pb.collection('v1_protensora_participante_trilhas').getList(1, 1, {})
        const c = await pb
          .collection('v1_protensora_participante_trilhas')
          .getList(1, 1, { filter: 'status="concluido"' })
        setStats({ trilhas: t.totalItems, users: u.totalItems, completions: c.totalItems })

        const prog = await pb
          .collection('v1_protensora_participante_trilhas')
          .getFullList({ expand: 'user_id' })
        const userMap: Record<string, any> = {}
        prog.forEach((p) => {
          const usr = p.expand?.user_id
          if (!usr) return
          if (!userMap[usr.id]) {
            userMap[usr.id] = {
              id: usr.id,
              name: usr.name || usr.email,
              email: usr.email,
              totalScore: 0,
              completions: 0,
            }
          }
          userMap[usr.id].totalScore += p.xp_total || 0
          if (p.status === 'concluido') userMap[usr.id].completions += 1
        })
        setRanking(
          Object.values(userMap)
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 50),
        )
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#1e3a8a]">Gestão Protensora</h2>
          <p className="text-muted-foreground">Visão geral das trilhas e desempenho dos alunos.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/saas/protensora/trilhas"
            className="bg-[#1e3a8a] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#1e3a8a]/90 transition-colors"
          >
            Gerenciar Trilhas
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trilhas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trilhas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alunos Matriculados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trilhas Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completions}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Ranking de Alunos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Posição</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-center">Trilhas Concluídas</TableHead>
                  <TableHead className="text-right">Pontuação Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center font-medium">
                      {i === 0 ? (
                        <span className="text-yellow-500 text-lg">🥇</span>
                      ) : i === 1 ? (
                        <span className="text-slate-400 text-lg">🥈</span>
                      ) : i === 2 ? (
                        <span className="text-amber-600 text-lg">🥉</span>
                      ) : (
                        `${i + 1}º`
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{r.completions}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#1e3a8a] flex items-center justify-end gap-1">
                      {r.totalScore} <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </TableCell>
                  </TableRow>
                ))}
                {ranking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      Nenhum aluno no ranking ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
