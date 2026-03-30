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
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TimeSlot } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

export default function Agenda() {
  const {
    timeSlots,
    mentees,
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
  const [deletingSlot, setDeletingSlot] = useState<TimeSlot | null>(null)

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
      originalSlot?: TimeSlot
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
        title: slot.isBooked ? `Sessão Agendada: ${slot.menteeName || 'Cliente'}` : 'Horário Livre',
        timeStr: slot.time,
        description: slot.isBooked
          ? slot.description || 'Sessão reservada pelo site'
          : 'Disponível para agendamento público',
        originalSlot: slot,
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
        await addTimeSlot({
          id: Math.random().toString(36).substr(2, 9),
          date: newSlotDate,
          time: newSlotTime,
          description: newSlotDescription,
          isBooked: false,
        })
        toast({ title: 'Horário Adicionado', description: 'Disponibilidade criada com sucesso.' })
        setIsAddOpen(false)
        setNewSlotDate('')
        setNewSlotTime('')
        setNewSlotDescription('')
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao adicionar horário.', variant: 'destructive' })
      }
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSlot) {
      try {
        await updateTimeSlot(editingSlot.id, editingSlot)
        toast({ title: 'Atualizado', description: 'O horário foi modificado.' })
        setEditingSlot(null)
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao atualizar.', variant: 'destructive' })
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingSlot) {
      try {
        if (deletingSlot.isBooked) {
          await unbookTimeSlot(deletingSlot.id)
          toast({ title: 'Reserva Cancelada', description: 'O horário voltou a ficar disponível.' })
        } else {
          await removeTimeSlot(deletingSlot.id)
          toast({ title: 'Removido', description: 'Horário excluído da agenda.' })
        }
        setDeletingSlot(null)
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Gestão de Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie seus compromissos, sessões e horários livres.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary hover:bg-primary/90 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Horário Livre
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
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="px-4 pt-4 pb-2 border-b">
              <Tabs defaultValue="todos" onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="livres">Livres</TabsTrigger>
                  <TabsTrigger value="agendados">Agendados</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 relative min-h-[300px]">
              <ScrollArea className="absolute inset-0">
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
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="font-semibold text-base">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center pl-2 gap-1">
                          {event.type === 'session' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                            >
                              <Link to="/admin/mentorados">
                                <ChevronRight className="w-5 h-5" />
                              </Link>
                            </Button>
                          )}
                          {event.type === 'slot_free' ? (
                            <Badge
                              variant="secondary"
                              className="bg-muted text-muted-foreground hover:bg-muted mr-1"
                            >
                              Livre
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary hover:bg-primary/20 mr-1"
                            >
                              Agendado
                            </Badge>
                          )}
                          {(event.type === 'slot_free' || event.type === 'slot_booked') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setEditingSlot(event.originalSlot!)}
                                >
                                  <Edit className="w-4 h-4 mr-2" /> Editar Horário
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingSlot(event.originalSlot!)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />{' '}
                                  {event.type === 'slot_booked'
                                    ? 'Cancelar Reserva'
                                    : 'Excluir Horário'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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
                    value={editingSlot.date}
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

      <AlertDialog open={!!deletingSlot} onOpenChange={(open) => !open && setDeletingSlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingSlot?.isBooked ? 'Cancelar Reserva?' : 'Excluir Horário?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingSlot?.isBooked
                ? 'Este horário está reservado. Ao confirmar, a reserva será cancelada e o horário voltará a ficar livre para novos agendamentos.'
                : 'Tem certeza que deseja excluir este horário livre? Esta ação removerá a disponibilidade da sua agenda pública.'}
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
