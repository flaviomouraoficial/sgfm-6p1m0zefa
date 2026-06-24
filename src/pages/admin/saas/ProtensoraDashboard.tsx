import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { BookOpen, Users, CheckCircle } from 'lucide-react'

export default function ProtensoraDashboard() {
  const [stats, setStats] = useState({ trilhas: 0, users: 0, completions: 0 })

  useEffect(() => {
    async function load() {
      try {
        const t = await pb
          .collection('v1_protensora_trilhas')
          .getList(1, 1, { filter: 'active=true' })
        const u = await pb.collection('v1_protensora_progresso').getList(1, 1, {})
        const c = await pb
          .collection('v1_protensora_progresso')
          .getList(1, 1, { filter: 'completed=true' })
        setStats({ trilhas: t.totalItems, users: u.totalItems, completions: c.totalItems })
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
          <p className="text-muted-foreground">Visão geral das trilhas e alunos matriculados.</p>
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
    </div>
  )
}
