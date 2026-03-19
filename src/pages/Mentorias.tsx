import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { exportToCSV, generateGoogleCalendarLink, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Mentee, Session, MenteeStatus, TimeSlot } from '@/lib/types'
import {
  Calendar,
  CheckCircle2,
  Download,
  Printer,
  Search,
  Phone,
  Mail,
  Clock,
  Plus,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

function StatusBadge({ status, className }: { status: MenteeStatus; className?: string }) {
  if (status === 'Ativo')
    return (
      <Badge
        className={cn(
          'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20',
          className,
        )}
      >
        Ativo
      </Badge>
    )
  if (status === 'Concluído')
    return (
      <Badge
        className={cn(
          'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20',
          className,
        )}
      >
        Concluído
      </Badge>
    )
  return (
    <Badge
      className={cn(
        'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20',
        className,
      )}
    >
      Pausado
    </Badge>
  )
}

export default function Mentorias() {
  const {
    company,
    companies,
    mentees,
    addMenteeSession,
    updateMentee,
    removeMentee,
    timeSlots,
    addTimeSlot,
    removeTimeSlot,
  } = useMainStore()

  // Mentee View States
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAddingSession, setIsAddingSession] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [newSession, setNewSession] = useState<Partial<Session>>({
    date: '',
    duration: 60,
    discussion: '',
    tasks: '',
  })

  // Edit & Delete Mentee States
  const [menteeToEdit, setMenteeToEdit] = useState<Mentee | null>(null)
  const [menteeToDelete, setMenteeToDelete] = useState<Mentee | null>(null)

  // Availability States
  const [newSlotDate, setNewSlotDate] = useState('')
  const [newSlotTime, setNewSlotTime] = useState('')

  const selected = useMemo(
    () => mentees.find((m) => m.id === selectedId) || null,
    [mentees, selectedId],
  )

  const filteredMentees = useMemo(() => {
    let res = company === 'Todas' ? mentees : mentees.filter((m) => m.company === company)
    if (statusFilter !== 'Todos') res = res.filter((m) => m.status === statusFilter)
    if (searchQuery)
      res = res.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return res
  }, [company, mentees, statusFilter, searchQuery])

  const availableSlots = useMemo(
    () =>
      timeSlots
        .filter((t) => !t.isBooked)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [timeSlots],
  )
  const bookedSlots = useMemo(
    () =>
      timeSlots
        .filter((t) => t.isBooked)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [timeSlots],
  )

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault()
    if (selected && newSession.date) {
      addMenteeSession(selected.id, {
        id: Math.random().toString(36).substr(2, 9),
        date: newSession.date,
        duration: Number(newSession.duration) || 60,
        discussion: newSession.discussion || '',
        tasks: newSession.tasks || '',
      } as Session)

      const newCount = selected.sessions.length + 1
      if (newCount >= selected.totalSessions && selected.status !== 'Concluído') {
        updateMentee(selected.id, { status: 'Concluído' })
      }
      toast({ title: 'Sucesso', description: 'Sessão registrada no prontuário.' })
      setIsAddingSession(false)
      setNewSession({ date: '', duration: 60, discussion: '', tasks: '' })
    }
  }

  const handleExportIndividual = () => {
    if (!selected) return
    const data = selected.sessions.map((s) => ({
      Mentorado: selected.name,
      Data: new Date(s.date).toLocaleString('pt-BR'),
      Duração: s.duration,
      Discussão: s.discussion,
      Tarefas: s.tasks,
    }))
    exportToCSV(`prontuario_${selected.name.replace(/\s+/g, '_')}.csv`, data)
  }

  const handleSaveMenteeEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (menteeToEdit) {
      updateMentee(menteeToEdit.id, menteeToEdit)
      toast({ title: 'Mentoria Atualizada', description: 'Os dados foram salvos com sucesso.' })
      setMenteeToEdit(null)
    }
  }

  const handleConfirmDelete = () => {
    if (menteeToDelete) {
      removeMentee(menteeToDelete.id)
      toast({ title: 'Mentoria Removida', description: 'O registro foi excluído.' })
      setMenteeToDelete(null)
    }
  }

  const handleAddAvailability = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSlotDate && newSlotTime) {
      addTimeSlot({
        id: Math.random().toString(36).substr(2, 9),
        date: newSlotDate,
        time: newSlotTime,
        isBooked: false,
      })
      toast({ title: 'Horário Adicionado', description: 'Sua disponibilidade foi atualizada.' })
      setNewSlotDate('')
      setNewSlotTime('')
    }
  }

  const now = new Date()
  const upcomingSessions =
    selected?.sessions
      .filter((s) => new Date(s.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || []
  const pastSessions =
    selected?.sessions
      .filter((s) => new Date(s.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Mentorias</h1>
        <div className="flex items-center space-x-2 print:hidden w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV('mentorias.csv', filteredMentees)}
            className="h-9"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mentorados" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="mentorados">Prontuários e Mentorados</TabsTrigger>
          <TabsTrigger value="agenda">Disponibilidade e Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="mentorados" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mentorando..."
                className="pl-8 h-9 w-full sm:w-[200px] text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos Status</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Concluído">Concluídos</SelectItem>
                <SelectItem value="Pausado">Pausados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMentees.map((mentee) => {
              const progress = (mentee.sessions.length / mentee.totalSessions) * 100
              return (
                <Card
                  key={mentee.id}
                  className="hover:border-primary/50 transition-colors cursor-pointer shadow-sm group relative"
                >
                  <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenteeToEdit(mentee)
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenteeToDelete(mentee)
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div onClick={() => setSelectedId(mentee.id)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start pr-6">
                        <div>
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {mentee.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {mentee.company}
                          </CardDescription>
                        </div>
                        <StatusBadge status={mentee.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                          <span>Sessões Concluídas</span>
                          <span>
                            {mentee.sessions.length} de {mentee.totalSessions}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )
            })}
            {filteredMentees.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                Nenhum mentorando encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" /> Gerenciar Disponibilidade
            </h2>
            <Button variant="outline" size="sm" asChild>
              <a
                href="/agendar"
                target="_blank"
                rel="noreferrer"
                className="flex items-center text-primary"
              >
                <LinkIcon className="w-4 h-4 mr-2" /> Ver Página de Agendamento
              </a>
            </Button>
          </div>

          <div className="grid md:grid-cols-[300px_1fr] gap-6 items-start">
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-base">Adicionar Horário</CardTitle>
                <CardDescription className="text-xs">
                  Libere horários na sua agenda para os mentorados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleAddAvailability} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-xs">
                      Data Disponível
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={newSlotDate}
                      onChange={(e) => setNewSlotDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-xs">
                      Horário
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      required
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Liberar Horário
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                  <CardTitle className="text-sm">Horários Livres (Não Reservados)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px]">
                    {availableSlots.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        Nenhum horário livre configurado.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {availableSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex justify-between items-center p-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center text-sm font-medium">
                              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                              {new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
                              {slot.time}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => removeTimeSlot(slot.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/20">
                <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
                  <CardTitle className="text-sm flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Sessões Agendadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[250px]">
                    {bookedSlots.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        Nenhuma sessão reservada ainda.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {bookedSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex flex-col p-4 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-bold text-sm text-primary">
                                {slot.menteeName}
                              </div>
                              <Badge variant="outline" className="text-[10px] bg-background">
                                {new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR')} •{' '}
                                {slot.time}
                              </Badge>
                            </div>
                            <a
                              href={`mailto:${slot.menteeEmail}`}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center"
                            >
                              <Mail className="w-3 h-3 mr-1" /> {slot.menteeEmail}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Mentee Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl md:w-[600px] p-0 flex flex-col border-l">
          {selected && (
            <>
              <SheetHeader className="p-6 border-b bg-muted/10 print:bg-transparent">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <SheetTitle className="text-xl flex items-center mb-1">
                      {selected.name}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={selected.status} />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 bg-background border rounded">
                        {selected.company}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1 print:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => window.print()}
                      title="Imprimir Prontuário"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={handleExportIndividual}
                      title="Exportar CSV"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-background p-3 rounded-lg border">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                      Valor do Contrato
                    </p>
                    <p className="font-bold text-sm text-primary">
                      R${' '}
                      {selected.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                      Progresso das Sessões
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress
                        value={(selected.sessions.length / selected.totalSessions) * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="font-bold text-[11px] text-foreground/90">
                        {selected.sessions.length}/{selected.totalSessions}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                  {(selected.phone || selected.email) && (
                    <div className="flex flex-wrap gap-3 print:hidden">
                      {selected.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Phone className="w-3.5 h-3.5 mr-2" /> WhatsApp
                          </a>
                        </Button>
                      )}
                      {selected.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          asChild
                        >
                          <a href={`mailto:${selected.email}`}>
                            <Mail className="w-3.5 h-3.5 mr-2" /> Enviar Email
                          </a>
                        </Button>
                      )}
                    </div>
                  )}

                  {upcomingSessions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold flex items-center text-foreground/90 mb-3">
                        <Calendar className="w-4 h-4 mr-2 text-primary" /> Próximas Sessões
                      </h3>
                      <div className="space-y-2">
                        {upcomingSessions.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg"
                          >
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-primary mr-3" />
                              <div>
                                <p className="text-sm font-medium">
                                  {new Date(s.date).toLocaleString('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </p>
                                {s.discussion && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {s.discussion}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px]" asChild>
                              <a
                                href={generateGoogleCalendarLink(
                                  `Mentoria: ${selected.name}`,
                                  s.date,
                                  s.duration,
                                  s.discussion,
                                )}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Add Agenda
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="print:hidden">
                    {isAddingSession ? (
                      <form
                        onSubmit={handleAddSession}
                        className="bg-card p-4 rounded-lg border shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Registrar Nova Sessão</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground"
                            onClick={() => setIsAddingSession(false)}
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
                              Data e Hora
                            </Label>
                            <Input
                              type="datetime-local"
                              required
                              className="text-xs h-8"
                              value={newSession.date}
                              onChange={(e) =>
                                setNewSession({ ...newSession, date: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
                              Duração (min)
                            </Label>
                            <Input
                              type="number"
                              required
                              className="text-xs h-8"
                              value={newSession.duration}
                              onChange={(e) =>
                                setNewSession({ ...newSession, duration: Number(e.target.value) })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
                            Assuntos Discutidos
                          </Label>
                          <Textarea
                            required
                            placeholder="Descreva o que foi falado na sessão..."
                            className="text-xs resize-none h-16"
                            value={newSession.discussion}
                            onChange={(e) =>
                              setNewSession({ ...newSession, discussion: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
                            Combinados / Tarefas
                          </Label>
                          <Textarea
                            placeholder="Tarefas e próximos passos..."
                            className="text-xs resize-none h-12"
                            value={newSession.tasks}
                            onChange={(e) =>
                              setNewSession({ ...newSession, tasks: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-accent text-accent-foreground hover:bg-accent/90 h-8"
                          >
                            Salvar Sessão
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        onClick={() => setIsAddingSession(true)}
                        className="w-full bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 border border-dashed shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Registrar Nova Sessão
                      </Button>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold flex items-center text-foreground/90 mb-4">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-muted-foreground" /> Histórico do
                      Prontuário
                    </h3>
                    {pastSessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-lg text-center border">
                        Nenhuma sessão registrada no histórico.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {pastSessions.map((s, i) => {
                          const sessionIndex = pastSessions.length - i
                          return (
                            <div
                              key={s.id}
                              className="relative pl-6 pb-2 border-l-2 border-border last:border-0 last:pb-0"
                            >
                              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-muted border-2 border-background rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full" />
                              </div>
                              <div className="bg-card border rounded-lg p-4 shadow-sm">
                                <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                                  <span className="font-bold text-sm text-foreground/90">
                                    Sessão {sessionIndex}
                                  </span>
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                    {new Date(s.date).toLocaleString('pt-BR', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}{' '}
                                    • {s.duration} min
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  {s.discussion && (
                                    <div>
                                      <span className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Discussão:
                                      </span>
                                      <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                                        {s.discussion}
                                      </p>
                                    </div>
                                  )}
                                  {s.tasks && (
                                    <div className="pt-2 border-t border-border/50">
                                      <span className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Combinados / Tarefas:
                                      </span>
                                      <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                                        {s.tasks}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Mentee Dialog */}
      <Dialog open={!!menteeToEdit} onOpenChange={(open) => !open && setMenteeToEdit(null)}>
        <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-screen">
          <DialogHeader>
            <DialogTitle>Editar Mentoria</DialogTitle>
          </DialogHeader>
          {menteeToEdit && (
            <form onSubmit={handleSaveMenteeEdit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="name">Nome do Mentorado</Label>
                  <Input
                    id="name"
                    value={menteeToEdit.name}
                    onChange={(e) => setMenteeToEdit({ ...menteeToEdit, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    value={menteeToEdit.phone || ''}
                    onChange={(e) => setMenteeToEdit({ ...menteeToEdit, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={menteeToEdit.email || ''}
                    onChange={(e) => setMenteeToEdit({ ...menteeToEdit, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
                  <Input
                    id="contractValue"
                    type="number"
                    step="0.01"
                    value={menteeToEdit.contractValue}
                    onChange={(e) =>
                      setMenteeToEdit({ ...menteeToEdit, contractValue: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalSessions">Total de Sessões</Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    value={menteeToEdit.totalSessions}
                    onChange={(e) =>
                      setMenteeToEdit({ ...menteeToEdit, totalSessions: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Empresa Vinculada</Label>
                  <Select
                    value={menteeToEdit.company}
                    onValueChange={(val) => setMenteeToEdit({ ...menteeToEdit, company: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={menteeToEdit.status}
                    onValueChange={(val: MenteeStatus) =>
                      setMenteeToEdit({ ...menteeToEdit, status: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Pausado">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setMenteeToEdit(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Mentee Alert */}
      <AlertDialog
        open={!!menteeToDelete}
        onOpenChange={(open) => !open && setMenteeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mentoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o registro de mentoria de{' '}
              <strong>{menteeToDelete?.name}</strong>? Esta ação removerá todo o histórico de
              sessões (prontuário) e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
