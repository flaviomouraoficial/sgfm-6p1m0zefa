import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Calendar as CalendarIcon, CheckCircle2, User, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Agenda() {
  const { timeSlots, mentees } = useMainStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Normalize all upcoming events
  const allEvents = useMemo(() => {
    const events: Array<{
      id: string
      dateObj: Date
      type: 'session' | 'slot_booked' | 'slot_free'
      title: string
      timeStr: string
      description?: string
      menteeId?: string
    }> = []

    // 1. Mentoring Sessions
    mentees.forEach((mentee) => {
      ;(mentee.sessions || []).forEach((session) => {
        if (!session.date) return
        const d = new Date(session.date)
        events.push({
          id: `sess-${session.id}`,
          dateObj: d,
          type: 'session',
          title: `Mentoria: ${mentee.name}`,
          timeStr: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          description: session.type || 'Sessão Agendada',
          menteeId: mentee.id,
        })
      })
    })

    // 2. TimeSlots (Public Booking)
    timeSlots.forEach((slot) => {
      const d = new Date(`${slot.date}T${slot.time}:00`)
      if (isNaN(d.getTime())) return

      events.push({
        id: `slot-${slot.id}`,
        dateObj: d,
        type: slot.isBooked ? 'slot_booked' : 'slot_free',
        title: slot.isBooked ? `Reserva: ${slot.menteeName}` : 'Horário Livre',
        timeStr: slot.time,
        description: slot.isBooked ? slot.menteeCompany : 'Disponível para agendamento público',
      })
    })

    return events.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
  }, [mentees, timeSlots])

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    return allEvents.filter(
      (e) =>
        e.dateObj.getDate() === selectedDate.getDate() &&
        e.dateObj.getMonth() === selectedDate.getMonth() &&
        e.dateObj.getFullYear() === selectedDate.getFullYear(),
    )
  }, [allEvents, selectedDate])

  // Dates that have at least one event
  const activeDates = useMemo(() => {
    return allEvents.map(
      (e) => new Date(e.dateObj.getFullYear(), e.dateObj.getMonth(), e.dateObj.getDate()),
    )
  }, [allEvents])

  const upcomingGlobal = useMemo(() => {
    const now = new Date()
    return allEvents.filter((e) => e.dateObj >= now).slice(0, 5)
  }, [allEvents])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestão de Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Visualize seus compromissos, sessões e horários livres.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/mentorados">Gerenciar Disponibilidade</Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-6 items-start">
        {/* Calendar Side */}
        <div className="space-y-6">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ active: activeDates }}
                modifiersClassNames={{
                  active: 'font-bold text-primary bg-primary/5',
                }}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="bg-muted/10 border-b pb-3">
              <CardTitle className="text-sm flex items-center">
                <Clock className="w-4 h-4 mr-2 text-secondary" /> Próximos 5 Compromissos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {upcomingGlobal.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Nenhum evento futuro.
                  </div>
                ) : (
                  upcomingGlobal.map((event) => (
                    <div
                      key={`global-${event.id}`}
                      className="p-3 hover:bg-muted/20 transition-colors flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-primary">
                          {event.dateObj.toLocaleDateString('pt-BR')} • {event.timeStr}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] h-4 px-1',
                            event.type === 'slot_free' && 'border-dashed',
                          )}
                        >
                          {event.type === 'slot_free' ? 'Livre' : 'Ocupado'}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-foreground leading-tight">
                        {event.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Details Side */}
        <Card className="shadow-sm border-border/60 lg:min-h-[600px] flex flex-col">
          <CardHeader className="border-b bg-accent text-accent-foreground rounded-t-lg">
            <CardTitle className="text-xl flex items-center">
              <CalendarIcon className="w-5 h-5 mr-3 opacity-80" />
              {selectedDate
                ? selectedDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : 'Selecione uma data'}
            </CardTitle>
            <CardDescription className="text-accent-foreground/70">
              {selectedDateEvents.length} compromisso(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative">
            <ScrollArea className="absolute inset-0">
              {selectedDateEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/60">
                  <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                  <p>Agenda livre neste dia.</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'group flex gap-4 p-4 rounded-xl border transition-all',
                        event.type === 'slot_free'
                          ? 'bg-muted/10 border-dashed border-muted-foreground/30'
                          : 'bg-card border-border shadow-sm hover:border-primary/40',
                      )}
                    >
                      <div className="w-16 shrink-0 text-center border-r pr-4 flex flex-col justify-center">
                        <span className="text-lg font-bold text-primary leading-none">
                          {event.timeStr}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-semibold text-base">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center pl-2">
                        {event.type === 'session' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                          >
                            <Link to="/mentorados">
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          </Button>
                        )}
                        {event.type === 'slot_free' && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            Livre
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
