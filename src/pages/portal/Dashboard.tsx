import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Clock, Video, Plus } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingSlot, setBookingSlot] = useState<string | null>(null)

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
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const records = await pb.collection('v1_time_slots').getFullList({
        filter: 'isBooked = false && date >= @now',
        sort: 'date,time',
      })
      setAvailableSlots(records)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchAgendamentos(), fetchAvailableSlots()])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [user])

  useRealtime('v1_agendamentos', () => {
    fetchAgendamentos()
  })

  useRealtime('v1_time_slots', () => {
    fetchAvailableSlots()
  })

  const handleBookSlot = async (slotId: string) => {
    setBookingSlot(slotId)
    try {
      await pb.send(`/backend/v1/book-slot/${slotId}`, {
        method: 'POST',
      })
      toast({
        title: 'Agendamento Confirmado',
        description: 'Seu horário foi reservado com sucesso.',
      })
      // Refetch will happen via realtime subscriptions
    } catch (error: any) {
      toast({
        title: 'Erro no Agendamento',
        description: getErrorMessage(error) || 'Não foi possível reservar este horário.',
        variant: 'destructive',
      })
    } finally {
      setBookingSlot(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Painel do Mentorado</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas sessões e gerencie novos agendamentos.
          </p>
        </div>
      </div>

      <Tabs defaultValue="agendamentos" className="space-y-6">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="agendamentos">Meus Compromissos</TabsTrigger>
          <TabsTrigger value="agendar">Agendar Sessão</TabsTrigger>
        </TabsList>

        <TabsContent value="agendamentos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Carregando compromissos...
              </div>
            ) : agendamentos.length === 0 ? (
              <Card className="col-span-full bg-muted/20 border-dashed border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CalendarDays className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium mb-2">
                    Você ainda não tem nenhum agendamento.
                  </p>
                  <p className="text-sm text-muted-foreground/70 mb-6">
                    Acesse a aba "Agendar Sessão" para escolher um horário.
                  </p>
                </CardContent>
              </Card>
            ) : (
              agendamentos.map((agendamento) => {
                const dateStr = agendamento.data_horario.split('.')[0].replace(' ', 'T')
                const dateObj = parseISO(dateStr)
                const isPast = dateObj < new Date()

                return (
                  <Card
                    key={agendamento.id}
                    className={isPast ? 'opacity-75 bg-muted/30' : 'shadow-sm border-primary/20'}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex justify-between items-start">
                        {agendamento.expand?.servico_id?.nome || 'Sessão de Mentoria'}
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                            isPast
                              ? 'bg-secondary/20 text-secondary-foreground'
                              : 'bg-primary/20 text-primary'
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
                      <div className="space-y-3 text-sm text-foreground/80">
                        <div className="flex items-center">
                          <CalendarDays className="w-4 h-4 mr-3 text-primary" />
                          <span className="font-medium">
                            {format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-3 text-primary" />
                          <span className="font-medium">{format(dateObj, 'HH:mm')}</span>
                        </div>
                        {!isPast && (
                          <div className="flex items-center text-primary mt-6 pt-4 border-t cursor-pointer hover:text-primary/80 transition-colors font-medium">
                            <Video className="w-4 h-4 mr-2" />
                            Acessar Reunião Online
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="agendar" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Buscando horários disponíveis...
              </div>
            ) : availableSlots.length === 0 ? (
              <Card className="col-span-full bg-muted/20 border-dashed border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">
                    Nenhum horário livre no momento.
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Por favor, volte mais tarde ou contate o administrador.
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableSlots.map((slot) => {
                const dateObj = parseISO(slot.date.split(' ')[0])

                return (
                  <Card
                    key={slot.id}
                    className="hover:border-primary/50 transition-colors shadow-sm flex flex-col"
                  >
                    <CardHeader className="pb-3 border-b bg-muted/10">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center">
                          <CalendarDays className="w-4 h-4 mr-2 text-primary" />{' '}
                          {format(dateObj, 'dd/MM/yyyy')}
                        </span>
                        <span className="flex items-center text-primary">
                          <Clock className="w-4 h-4 mr-1" /> {slot.time}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex-1">
                      <p className="text-sm text-muted-foreground">
                        {slot.description || 'Sessão de Mentoria Online'}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        className="w-full"
                        onClick={() => handleBookSlot(slot.id)}
                        disabled={bookingSlot === slot.id}
                      >
                        {bookingSlot === slot.id ? (
                          <>Processando...</>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" /> Reservar Horário
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
