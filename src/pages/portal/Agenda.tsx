import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function PortalAgenda() {
  const { user } = useAuth()
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [mySessions, setMySessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadData = async () => {
    if (!user?.email) return
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0] + ' 00:00:00.000Z'

      const slotsRes = await pb.collection('v1_time_slots').getFullList({
        filter: `isBooked = false && date >= "${todayStr}"`,
        sort: 'date,time',
      })
      setAvailableSlots(slotsRes)

      const myAg = await pb.collection('v1_agendamentos').getFullList({
        filter: `cliente_email = "${user.email}" && data_horario >= "${todayStr}"`,
        sort: 'data_horario',
        expand: 'servico_id',
      })
      setMySessions(myAg)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.email])

  useRealtime('v1_time_slots', () => loadData(), !!user)
  useRealtime('v1_agendamentos', () => loadData(), !!user)

  const handleBook = async (slotId: string) => {
    setBookingId(slotId)
    try {
      await pb.send(`/backend/v1/book-slot/${slotId}`, { method: 'POST' })
      toast({
        title: 'Agendamento Confirmado',
        description: 'Sua sessão foi reservada com sucesso.',
      })
      await loadData()
    } catch (err) {
      toast({
        title: 'Erro no Agendamento',
        description: getErrorMessage(err) || 'Não foi possível reservar este horário.',
        variant: 'destructive',
      })
    } finally {
      setBookingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-accent tracking-tight">Minha Agenda</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas sessões de mentoria e marque novos horários.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Meus Próximos Compromissos
          </h2>

          {mySessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                <CalendarDays className="w-10 h-10 mb-3 opacity-20" />
                <p>Nenhuma sessão agendada no momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mySessions.map((session) => {
                const d = parseISO(session.data_horario)
                return (
                  <Card key={session.id} className="shadow-sm border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">
                          {format(d, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-4 h-4" /> {format(d, 'HH:mm')}
                        </p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-green-500 opacity-80" />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Horários Disponíveis
          </h2>

          {availableSlots.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                <Clock className="w-10 h-10 mb-3 opacity-20" />
                <p>Nenhum horário livre no momento.</p>
                <p className="text-sm mt-1">Por favor, volte mais tarde.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {availableSlots.map((slot) => {
                const dateObj = parseISO(slot.date.split(' ')[0])
                const isBookingThis = bookingId === slot.id
                return (
                  <Card
                    key={slot.id}
                    className="shadow-sm hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {format(dateObj, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {slot.time}
                        </p>
                      </div>
                      <Button onClick={() => handleBook(slot.id)} disabled={!!bookingId} size="sm">
                        {isBookingThis ? 'Reservando...' : 'Agendar'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
