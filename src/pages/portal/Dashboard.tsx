import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Calendar } from 'lucide-react'

export default function PortalDashboard() {
  const { user } = useAuth()
  const [mentee, setMentee] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!user?.email) return
    const fetchMenteeData = async () => {
      try {
        const mentees = await pb.collection('v1_mentees').getFullList({
          filter: `email = '${user.email}'`,
        })
        if (mentees.length > 0) {
          setMentee(mentees[0])
          const sessoes = await pb.collection('v1_sessoes').getFullList({
            filter: `mentee_id = '${mentees[0].id}'`,
            sort: '-date',
          })
          setSessions(sessoes)
        }
      } catch (err) {
        console.error('Error fetching mentee data', err)
      }
    }
    fetchMenteeData()
  }, [user])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meu Painel</h1>
      {mentee ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Progresso da Mentoria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">Sessões Realizadas / Total</p>
              <div className="text-3xl font-bold">
                {sessions.filter((s) => s.status === 'Realizada').length} / {mentee.totalSessions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Próxima Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.filter((s) => s.status === 'Agendada').length > 0 ? (
                <div className="space-y-4">
                  {sessions
                    .filter((s) => s.status === 'Agendada')
                    .map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold">
                            {new Date(s.date).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-muted-foreground">{s.type || 'Sessão'}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma sessão agendada no momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground mt-4">
            Nenhum dado de mentoria encontrado vinculado ao seu e-mail de acesso.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
