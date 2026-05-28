import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Printer,
  Copy,
  Mail,
  Phone,
  Layers,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TimeSlot } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { ptBR } from 'date-fns/locale'

export default function Agenda() {
  const {
    mentees,
    clients,
    clientSessions,
    agendamentos,
    timeSlots,
    addTimeSlot,
    updateTimeSlot,
    removeTimeSlot,
    unbookTimeSlot,
    isSyncing,
  } = useMainStore()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newSlotDate, setNewSlotDate] = useState('')
  const [newSlotTime, setNewSlotTime] = useState('')
  const [newSlotDescription, setNewSlotDescription] = useState('')

  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<any>(null)

  const [filter, setFilter] = useState<'todos' | 'livres' | 'agendados'>('todos')

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
      contactEmail?: string
      contactPhone?: string
      originalId?: string
      originalSlot?: TimeSlot
    }> = []

    const getTimeKey = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`

    const sessionTimes = new Set<string>()
    const agendamentoTimes = new Set<string>()
    const sessionAgendamentoIds = new Set<string>()
    const emailTimeKeys = new Set<string>()

    // 1. Mentoring & Client Sessions (Highest Priority)
    clientSessions?.forEach((session) => {
      if (!session.date) return
      const d = new Date(session.date.replace(' ', 'T'))
      const timeKey = getTimeKey(d)
      sessionTimes.add(timeKey)
      if (session.agendamento_id) sessionAgendamentoIds.add(session.agendamento_id)

      let contactName = 'Sessão'
      let contactEmail = 'Não informado'
      let contactPhone = 'Não informado'
      let menteeId = session.mentee_id

      const mentee = mentees.find((m) => m.id === session.mentee_id) || session.expand?.mentee_id
      const client = clients.find((c) => c.id === session.client_id) || session.expand?.client_id

      if (mentee) {
        contactName = mentee.name || contactName
        contactEmail = mentee.email || contactEmail
        contactPhone = mentee.phone || contactPhone
      } else if (client) {
        contactName = client.name || contactName
        contactEmail = client.email || contactEmail
        contactPhone = client.phone || contactPhone
      }

      if (session.expand?.agendamento_id) {
        contactName = session.expand.agendamento_id.cliente_nome || contactName
        contactEmail = session.expand.agendamento_id.cliente_email || contactEmail
        contactPhone = session.expand.agendamento_id.cliente_telefone || contactPhone
      }

      if (contactEmail && contactEmail !== 'Não informado') {
        emailTimeKeys.add(`${contactEmail}-${timeKey}`)
      }

      events.push({
        id: `sess-${session.id}`,
        dateObj: d,
        type: 'session',
        title: `Sessão: ${contactName}`,
        timeStr: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        description: [
          session.type || 'Sessão Agendada',
          session.status && session.status !== 'Agendada' ? `(${session.status})` : '',
          session.notes ? `- ${session.notes}` : '',
        ]
          .filter(Boolean)
          .join(' '),
        menteeId,
        contactEmail,
        contactPhone,
        originalId: session.id,
      })
    })

    // 2. Agendamentos (Medium Priority)
    agendamentos?.forEach((ag) => {
      if (!ag.data_horario) return
      if (sessionAgendamentoIds.has(ag.id)) return // Deduplicate by agendamento_id

      const d = new Date(ag.data_horario.replace(' ', 'T'))
      const timeKey = getTimeKey(d)

      // Deduplicate by exact time if it's already a session
      if (sessionTimes.has(timeKey)) return

      const contactEmail = ag.cliente_email || ag.expand?.mentee_id?.email || 'Não informado'
      if (contactEmail !== 'Não informado') {
        if (emailTimeKeys.has(`${contactEmail}-${timeKey}`)) return
        emailTimeKeys.add(`${contactEmail}-${timeKey}`)
      }

      agendamentoTimes.add(timeKey)

      events.push({
        id: `ag-${ag.id}`,
        dateObj: d,
        type: 'session',
        title: `Agendamento: ${ag.cliente_nome}`,
        timeStr: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        description: ag.expand?.servico_id?.nome || 'Serviço Agendado',
        contactEmail,
        contactPhone: ag.cliente_telefone || 'Não informado',
        menteeId: ag.mentee_id,
        originalId: ag.id,
      })
    })

    // 3. TimeSlots (Lowest Priority)
    timeSlots.forEach((slot) => {
      if (!slot.date) return
      const safeDate = slot.date.substring(0, 10)
      const timeStr = slot.time || '12:00'
      const d = new Date(`${safeDate}T${timeStr}:00`)
      if (isNaN(d.getTime())) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (d < today) return

      const timeKey = getTimeKey(d)

      const contactEmail = slot.menteeEmail || 'Não informado'

      // Deduplicate: If there is ANY session or agendamento at this exact time, hide booked slot
      if (slot.isBooked) {
        if (sessionTimes.has(timeKey) || agendamentoTimes.has(timeKey)) return
        if (contactEmail !== 'Não informado' && emailTimeKeys.has(`${contactEmail}-${timeKey}`))
          return
      }

      events.push({
        id: `slot-${slot.id}`,
        dateObj: d,
        type: slot.isBooked ? 'slot_booked' : 'slot_free',
        title: slot.isBooked ? `Reserva: ${slot.menteeName || 'Cliente'}` : 'Horário Livre',
        timeStr: slot.time,
        description: slot.isBooked
          ? slot.description || 'Sessão reservada pelo site'
          : 'Disponível para agendamento público',
        originalSlot: slot,
        contactEmail: slot.menteeEmail || 'Não informado',
        contactPhone: slot.menteePhone || 'Não informado',
        originalId: slot.id,
      })
    })

    return events.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
  }, [clientSessions, mentees, clients, agendamentos, timeSlots])

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

  const filteredEvents = useMemo(() => {
    if (filter === 'todos') return selectedDateEvents
    if (filter === 'livres') return selectedDateEvents.filter((e) => e.type === 'slot_free')
    if (filter === 'agendados')
      return selectedDateEvents.filter((e) => e.type === 'slot_booked' || e.type === 'session')
    return selectedDateEvents
  }, [selectedDateEvents, filter])

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

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newSlotDate && newSlotTime) {
      try {
        const isoDate = new Date(newSlotDate + 'T12:00:00').toISOString()
        await addTimeSlot({
          date: isoDate,
          time: newSlotTime,
          description: newSlotDescription,
          isBooked: false,
        })
        toast({ title: 'Horário Adicionado', description: 'Disponibilidade criada com sucesso.' })
        setIsAddOpen(false)
        setNewSlotDate('')
        setNewSlotTime('')
        setNewSlotDescription('')
      } catch (err: any) {
        toast({
          title: 'Erro',
          description:
            getErrorMessage(err) || 'Falha ao criar o horário: verifique os dados preenchidos.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSlot) {
      try {
        const { id, created, updated, expand, collectionId, collectionName, ...safeData } =
          editingSlot as any
        if (safeData.date && safeData.date.length === 10) {
          safeData.date = new Date(safeData.date + 'T12:00:00').toISOString()
        }
        await updateTimeSlot(editingSlot.id, safeData)
        toast({ title: 'Atualizado', description: 'O horário foi modificado.' })
        setEditingSlot(null)
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: getErrorMessage(err) || 'Falha ao atualizar.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingEvent) {
      try {
        if (deletingEvent.type === 'slot_booked') {
          await unbookTimeSlot(deletingEvent.originalId)
          toast({ title: 'Reserva Cancelada', description: 'O horário voltou a ficar disponível.' })
        } else if (deletingEvent.type === 'slot_free') {
          await removeTimeSlot(deletingEvent.originalId)
          toast({ title: 'Removido', description: 'Horário excluído da agenda.' })
        } else if (deletingEvent.type === 'session') {
          if (deletingEvent.id.startsWith('ag-')) {
            await pb.collection('v1_agendamentos').delete(deletingEvent.originalId)

            // Find and unbook associated public slot robustly
            const dObj = deletingEvent.dateObj
            const timeKeyStr = `${dObj.getFullYear()}-${dObj.getMonth()}-${dObj.getDate()}-${dObj.getHours()}-${dObj.getMinutes()}`
            const associatedSlot = timeSlots.find((s) => {
              if (!s.date) return false
              const d = new Date(`${s.date.substring(0, 10)}T${s.time || '12:00'}:00`)
              const sTimeKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`
              return sTimeKey === timeKeyStr
            })
            if (associatedSlot && associatedSlot.isBooked) {
              await unbookTimeSlot(associatedSlot.id)
            }

            toast({
              title: 'Agendamento Removido',
              description: 'O agendamento foi excluído da agenda.',
            })
          } else if (deletingEvent.id.startsWith('sess-')) {
            const sessId = deletingEvent.originalId
            const session = clientSessions.find((s) => s.id === sessId)

            await pb.collection('v1_sessoes').delete(sessId)

            if (session?.agendamento_id) {
              try {
                await pb.collection('v1_agendamentos').delete(session.agendamento_id)
              } catch {
                /* intentionally ignored */
              }
            }

            // Find and unbook associated public slot robustly
            const dObj = deletingEvent.dateObj
            const timeKeyStr = `${dObj.getFullYear()}-${dObj.getMonth()}-${dObj.getDate()}-${dObj.getHours()}-${dObj.getMinutes()}`
            const associatedSlot = timeSlots.find((s) => {
              if (!s.date) return false
              const d = new Date(`${s.date.substring(0, 10)}T${s.time || '12:00'}:00`)
              const sTimeKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`
              return sTimeKey === timeKeyStr
            })
            if (associatedSlot && associatedSlot.isBooked) {
              await unbookTimeSlot(associatedSlot.id)
            }

            toast({ title: 'Sessão Removida', description: 'A sessão foi excluída com sucesso.' })
          }
        }
        setDeletingEvent(null)
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: getErrorMessage(err) || 'Falha ao excluir.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestão de Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie seus compromissos, sessões e horários livres.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              const link = `${window.location.origin}/agendar`
              navigator.clipboard.writeText(link)
              toast({
                title: 'Link Copiado',
                description: 'O link de agendamento foi copiado para a área de transferência.',
              })
            }}
            className="bg-white shadow-sm"
          >
            <Copy className="w-4 h-4 mr-2" /> Copiar Link
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="bg-white shadow-sm">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Horário Livre
          </Button>
        </div>
      </div>

      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold mb-2">Relatório de Agenda</h1>
        <p className="text-gray-500">
          Data Base:{' '}
          {selectedDate
            ? selectedDate.toLocaleDateString('pt-BR')
            : new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-6 items-start print:block">
        {/* Calendar Side */}
        <div className="space-y-6 print:hidden">
          <Card className="shadow-sm border-border/60 h-fit min-h-min overflow-visible">
            <CardContent className="p-3 pb-6 flex justify-center overflow-visible h-fit min-h-[380px] [&_td]:flex-1 [&_th]:flex-1 [&_.rdp-months]:w-full [&_.rdp-months]:h-fit [&_.rdp-month]:w-full [&_.rdp-month]:h-fit [&_.rdp-table]:w-full [&_.rdp-table]:h-fit [&_.rdp]:h-fit">
              <Calendar
                mode="single"
                locale={ptBR}
                formatters={{
                  formatWeekdayName: (date) => {
                    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                    return days[date.getDay()]
                  },
                  formatMonthCaption: (date) => {
                    const monthStr = date.toLocaleString('pt-BR', { month: 'long' })
                    return `${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)} ${date.getFullYear()}`
                  },
                  formatCaption: (date) => {
                    const monthStr = date.toLocaleString('pt-BR', { month: 'long' })
                    return `${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)} ${date.getFullYear()}`
                  },
                }}
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ active: activeDates }}
                modifiersClassNames={{
                  active: 'font-bold text-primary bg-primary/5',
                }}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                }}
                className="w-full max-w-[320px] mx-auto h-fit min-h-min"
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
                            event.type === 'slot_free'
                              ? 'border-dashed text-muted-foreground'
                              : 'bg-primary/10 text-primary border-primary/20',
                          )}
                        >
                          {event.type === 'slot_free' ? 'Livre' : 'Agendado'}
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
        <Card className="shadow-sm border-border/60 lg:min-h-[600px] flex flex-col print:border-none print:shadow-none">
          <CardHeader className="border-b bg-accent text-accent-foreground rounded-t-lg print:bg-transparent print:text-black print:border-b-2 print:border-black print:px-0">
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
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="px-4 pt-4 pb-2 border-b print:hidden">
              <Tabs defaultValue="todos" onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="livres">Livres</TabsTrigger>
                  <TabsTrigger value="agendados">Agendados</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 relative min-h-[300px] print:min-h-0">
              <ScrollArea className="absolute inset-0 print:relative print:h-auto">
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/60">
                    <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                    <p>Nenhum compromisso encontrado.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {filteredEvents.map((event) => (
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
                        <div className="flex-1 flex flex-col justify-center py-1">
                          <h3 className="font-semibold text-base leading-tight mb-1">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 mt-1">
                            {(event.type === 'session' || event.type === 'slot_booked') && (
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-md border border-border/50">
                                <span
                                  className="flex items-center gap-1.5 truncate max-w-[200px]"
                                  title={event.contactEmail}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  {event.contactEmail}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" />
                                  {event.contactPhone}
                                </span>
                              </div>
                            )}
                            {(() => {
                              const otherDatesCount = allEvents.filter(
                                (e) =>
                                  e.id !== event.id &&
                                  ((e.menteeId && e.menteeId === event.menteeId) ||
                                    (e.contactEmail &&
                                      e.contactEmail !== 'Não informado' &&
                                      e.contactEmail === event.contactEmail)),
                              ).length
                              return otherDatesCount > 0 ? (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10 w-fit">
                                  <Layers className="w-3.5 h-3.5" />+{otherDatesCount}{' '}
                                  compromisso(s) associado(s)
                                </span>
                              ) : null
                            })()}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center pl-2 gap-2 print:hidden justify-between">
                          <div className="flex items-center gap-1">
                            {event.type === 'session' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-primary print:hidden h-8 w-8"
                              >
                                <Link to="/admin/mentorados">
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              </Button>
                            )}
                            {event.type === 'slot_free' ? (
                              <Badge
                                variant="secondary"
                                className="bg-muted text-muted-foreground hover:bg-muted"
                              >
                                Livre
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary hover:bg-primary/20"
                              >
                                Agendado
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground h-8 w-8"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(event.type === 'slot_free' || event.type === 'slot_booked') && (
                                <DropdownMenuItem
                                  onClick={() => setEditingSlot(event.originalSlot!)}
                                >
                                  <Edit className="w-4 h-4 mr-2" /> Editar Horário
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeletingEvent(event)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />{' '}
                                {event.type === 'slot_booked'
                                  ? 'Cancelar Reserva'
                                  : event.type === 'slot_free'
                                    ? 'Excluir Horário'
                                    : 'Excluir / Cancelar'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Disponibilidade</DialogTitle>
            <DialogDescription>
              Crie um horário livre para que seus mentorados possam realizar o agendamento via link
              público.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSlot} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  required
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição / Tipo (Opcional)</Label>
              <Input
                placeholder="Ex: Reunião de Alinhamento"
                value={newSlotDescription}
                onChange={(e) => setNewSlotDescription(e.target.value)}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSyncing}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Horário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Horário</DialogTitle>
            <DialogDescription>Atualize as informações deste horário público.</DialogDescription>
          </DialogHeader>
          {editingSlot && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={editingSlot.date.substring(0, 10)}
                    onChange={(e) => setEditingSlot({ ...editingSlot, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    required
                    value={editingSlot.time}
                    onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição / Tipo</Label>
                <Input
                  placeholder="Ex: Reunião de Alinhamento"
                  value={editingSlot.description || ''}
                  onChange={(e) => setEditingSlot({ ...editingSlot, description: e.target.value })}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingSlot(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSyncing}>
                  {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingEvent?.type === 'slot_booked'
                ? 'Cancelar Reserva?'
                : deletingEvent?.type === 'slot_free'
                  ? 'Excluir Horário Livre?'
                  : 'Remover Agendamento / Sessão?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEvent?.type === 'slot_booked'
                ? 'Este horário está reservado. Ao confirmar, a reserva será cancelada e o horário voltará a ficar livre para novos agendamentos.'
                : deletingEvent?.type === 'slot_free'
                  ? 'Tem certeza que deseja excluir este horário livre? Esta ação removerá a disponibilidade da sua agenda pública.'
                  : 'Tem certeza que deseja cancelar e excluir permanentemente este agendamento ou sessão? Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSyncing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
