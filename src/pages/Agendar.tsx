import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TimeSlot {
  id: string
  date: string
  time: string
  isBooked: boolean
  description: string
}

export default function Agendar() {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchSlots()

    // Subscribe to realtime updates for time slots
    let unsubscribe: () => void
    pb.collection('v1_time_slots')
      .subscribe('*', () => {
        fetchSlots()
      })
      .then((unsub) => {
        unsubscribe = unsub
      })
      .catch(() => {})

    return () => {
      if (unsubscribe) unsubscribe()
      pb.collection('v1_time_slots').unsubscribe('*')
    }
  }, [])

  const fetchSlots = async () => {
    try {
      const records = await pb.collection('v1_time_slots').getFullList<TimeSlot>({
        filter: 'isBooked = false && date >= @now',
        sort: 'date,time',
      })
      setSlots(records)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setIsSubmitting(true)
    try {
      // Create the appointment
      await pb.collection('v1_agendamentos').create({
        cliente_nome: form.name,
        cliente_email: form.email,
        cliente_telefone: form.phone,
        data_horario: `${selectedSlot.date.split(' ')[0]} ${selectedSlot.time}:00`,
        status: 'Confirmado',
      })

      // Update the slot to booked
      await pb.collection('v1_time_slots').update(selectedSlot.id, {
        isBooked: true,
        menteeName: form.name,
        menteeEmail: form.email,
        menteePhone: form.phone,
      })

      setSuccess(true)
      toast({
        title: 'Sucesso!',
        description: 'Seu agendamento foi confirmado com sucesso.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o agendamento. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 pb-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h2>
            <p className="text-slate-600 mb-6">
              Em breve você receberá mais informações sobre sua sessão.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Portal de Agendamento</h1>
          <p className="mt-2 text-slate-600">Selecione um horário disponível para sua sessão.</p>
        </div>

        {!selectedSlot ? (
          <Card>
            <CardHeader>
              <CardTitle>Horários Disponíveis</CardTitle>
              <CardDescription>Escolha o melhor dia e horário para você</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Carregando horários...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhum horário disponível no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {slots.map((slot) => {
                    const dateObj = parseISO(slot.date.split(' ')[0])
                    return (
                      <Button
                        key={slot.id}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <CalendarDays className="w-5 h-5 text-primary" />
                        <span className="font-medium">
                          {format(dateObj, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <div className="flex items-center text-slate-500 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          {slot.time}
                        </div>
                      </Button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Confirme seus Dados</CardTitle>
              <CardDescription>
                Você selecionou:{' '}
                <span className="font-semibold text-primary">
                  {format(parseISO(selectedSlot.date.split(' ')[0]), 'dd/MM/yyyy')} às{' '}
                  {selectedSlot.time}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedSlot(null)}
                    disabled={isSubmitting}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
