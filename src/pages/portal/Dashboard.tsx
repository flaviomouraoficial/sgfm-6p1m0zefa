import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, Video } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAgendamentos = async () => {
    if (!user?.email) return
    try {
      const records = await pb.collection('v1_agendamentos').getFullList({
        filter: `cliente_email = '${user.email}'`,
        sort: '-data_horario',
        expand: 'servico_id,profissional_id',
      })
      setAgendamentos(records)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgendamentos()
  }, [user])

  useRealtime('v1_agendamentos', () => {
    fetchAgendamentos()
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Compromissos</h1>
        <p className="text-slate-500">Acompanhe suas sessões e agendamentos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Carregando...</div>
        ) : agendamentos.length === 0 ? (
          <Card className="col-span-full bg-slate-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">Você ainda não tem nenhum agendamento.</p>
            </CardContent>
          </Card>
        ) : (
          agendamentos.map((agendamento) => {
            const dateObj = parseISO(agendamento.data_horario.replace(' ', 'T'))
            const isPast = dateObj < new Date()

            return (
              <Card key={agendamento.id} className={isPast ? 'opacity-70' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex justify-between items-start">
                    {agendamento.expand?.servico_id?.nome || 'Sessão de Mentoria'}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isPast ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {agendamento.status || 'Confirmado'}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    com {agendamento.expand?.profissional_id?.nome || 'Flávio Moura'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {format(dateObj, 'HH:mm')}
                    </div>
                    <div className="flex items-center text-primary mt-4 cursor-pointer hover:underline">
                      <Video className="w-4 h-4 mr-2" />
                      Acessar Reunião
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
