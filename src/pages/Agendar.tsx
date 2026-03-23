import { useState, useMemo, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, CheckCircle2, Clock, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import logoUrl from '../assets/logo-21a08.jpg'
import { TimeSlot } from '@/lib/types'

export default function Agendar() {
  const { timeSlots, bookTimeSlot, isInitialLoad, syncData, systemSettings } = useMainStore()

  useEffect(() => {
    if (isInitialLoad) {
      syncData()
    }
  }, [isInitialLoad, syncData])

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [topic, setTopic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const availableSlots = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return timeSlots.filter((t) => !t.isBooked && new Date(t.date + 'T00:00:00') >= now)
  }, [timeSlots])

  const activeDates = useMemo(() => {
    return availableSlots.map((s) => new Date(s.date + 'T00:00:00'))
  }, [availableSlots])

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return availableSlots
      .filter((s) => s.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [availableSlots, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !name || !email || !topic) return

    setIsSubmitting(true)
    try {
      await bookTimeSlot(selectedSlot.id, name, email, phone, topic)
      setIsSuccess(true)
      toast({ title: 'Sucesso', description: 'Sessão agendada com sucesso!' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível agendar. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/10 p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-border/50">
          <CardContent className="pt-10 pb-10 space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground">
              Sua mentoria com {systemSettings?.companyName || 'Flávio Moura'} foi agendada para o
              dia{' '}
              <strong>
                {selectedSlot &&
                  format(new Date(selectedSlot.date + 'T00:00:00'), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
              </strong>{' '}
              às <strong>{selectedSlot?.time}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Enviamos os detalhes para o seu e-mail: <br />{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Fazer novo agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col items-center py-10 px-4">
      <Card className="w-full max-w-4xl shadow-xl border-border/50 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/3 bg-accent text-accent-foreground p-8 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="w-24 h-24 bg-white rounded-2xl p-2 mb-6 shadow-md flex items-center justify-center">
            <img
              src={systemSettings?.logo || logoUrl}
              alt="Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold mb-2">{systemSettings?.companyName || 'Mentoria'}</h2>
          <p className="text-accent-foreground/80 text-sm mb-6">
            Selecione uma data e horário disponíveis para agendar sua sessão de mentoria ou
            diagnóstico.
          </p>
          <div className="flex items-center text-sm font-medium mt-auto text-accent-foreground/90 bg-accent-foreground/10 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4 mr-2" /> Duração Padrão: 60 min
          </div>
        </div>

        <div className="md:w-2/3 p-6 md:p-8 bg-card relative min-h-[500px]">
          {!selectedSlot ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                Selecione Data e Horário
              </h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 flex justify-center sm:justify-start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{ active: activeDates }}
                    modifiersClassNames={{ active: 'font-bold text-primary bg-primary/10' }}
                    disabled={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      const startOfToday = new Date()
                      startOfToday.setHours(0, 0, 0, 0)
                      return !availableSlots.some((s) => s.date === dateStr) || date < startOfToday
                    }}
                    className="rounded-md border shadow-sm w-full"
                  />
                </div>
                <div className="flex-1 border-l sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0">
                  {selectedDate ? (
                    slotsForSelectedDate.length > 0 ? (
                      <div className="space-y-3 animate-in fade-in">
                        <p className="text-sm font-medium text-muted-foreground flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {format(selectedDate, "dd 'de' MMM", { locale: ptBR })}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-2">
                          {slotsForSelectedDate.map((slot) => (
                            <Button
                              key={slot.id}
                              variant="outline"
                              className="w-full justify-center border-primary/20 hover:border-primary hover:bg-primary/5 text-primary h-11 transition-all"
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-10 animate-in fade-in">
                        <CheckCircle2 className="w-10 h-10 mb-2" />
                        <p className="text-sm text-center">Nenhum horário livre nesta data.</p>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-10">
                      <CalendarIcon className="w-10 h-10 mb-2" />
                      <p className="text-sm">Selecione um dia disponível no calendário</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 border-b pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedSlot(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-semibold text-foreground">Confirmar Agendamento</h3>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                    Horário Selecionado
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {format(new Date(selectedSlot.date + 'T00:00:00'), "dd 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary bg-background px-3 py-1 rounded shadow-sm border border-primary/10">
                  {selectedSlot.time}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Nome do Mentorado *</Label>
                  <Input
                    required
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Assunto / Tópico da Mentoria *</Label>
                  <Textarea
                    required
                    placeholder="Descreva o foco principal desta sessão..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="resize-none h-20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-4 h-11 text-base font-semibold shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Confirmar Agendamento
                </Button>
              </form>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
