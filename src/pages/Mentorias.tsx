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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DialogDescription,
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
  Send,
  Bell,
  BellRing,
  RefreshCw,
  Tag,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

function StatusBadge({ status, className }: { status: MenteeStatus | string; className?: string }) {
  if (status === 'Ativo' || status === 'Realizada')
    return (
      <Badge
        className={cn(
          'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20',
          className,
        )}
      >
        {status}
      </Badge>
    )
  if (status === 'Concluído' || status === 'Agendada')
    return (
      <Badge
        className={cn(
          'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20',
          className,
        )}
      >
        {status}
      </Badge>
    )
  return (
    <Badge
      className={cn(
        'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20',
        status === 'Cancelada' && 'bg-destructive/10 text-destructive border-destructive/20',
        className,
      )}
    >
      {status}
    </Badge>
  )
}

const formatDateTimeLocal = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const SESSION_TYPES = [
  'Reunião de Diagnóstico',
  'Acompanhamento de Metas',
  'Sessão Técnica',
  'Revisão de Resultados',
  'Outro',
]

const SESSION_STATUSES = ['Agendada', 'Realizada', 'Cancelada']

export default function Mentorias() {
  const {
    company,
    companies,
    mentees,
    addMentee,
    addMenteeSession,
    updateMenteeSession,
    removeMenteeSession,
    updateMentee,
    removeMentee,
    timeSlots,
    addTimeSlot,
    updateTimeSlot,
    removeTimeSlot,
    unbookTimeSlot,
    addMenteeEmailLog,
    emailConfig,
    sessionReminderConfig,
    setSessionReminderConfig,
    messageTemplates,
    setMessageTemplates,
    notificationLogs,
    isSyncing,
  } = useMainStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAddingSession, setIsAddingSession] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [newSession, setNewSession] = useState<Partial<Session>>({
    date: '',
    duration: 60,
    discussion: '',
    tasks: '',
    type: 'Acompanhamento de Metas',
    status: 'Agendada',
  })

  const [editingSession, setEditingSession] = useState<{
    menteeId: string
    session: Session
  } | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<{
    menteeId: string
    sessionId: string
  } | null>(null)

  const [isAddingMentee, setIsAddingMentee] = useState(false)
  const [newMentee, setNewMentee] = useState<Partial<Mentee>>({
    name: '',
    company: companies[0] || '',
    contractValue: 0,
    totalSessions: 10,
    status: 'Ativo',
    phone: '',
    email: '',
  })

  const [menteeToEdit, setMenteeToEdit] = useState<Mentee | null>(null)
  const [menteeToDelete, setMenteeToDelete] = useState<Mentee | null>(null)

  const [sessionsPeriod, setSessionsPeriod] = useState<'all' | 'month' | 'week' | 'day'>('all')

  const [newSlotDate, setNewSlotDate] = useState('')
  const [newSlotTime, setNewSlotTime] = useState('')
  const [newSlotDescription, setNewSlotDescription] = useState('')
  const [timeSlotToEdit, setTimeSlotToEdit] = useState<TimeSlot | null>(null)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)

  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [reminderConfig, setReminderConfig] = useState(sessionReminderConfig)

  const [localTemplates, setLocalTemplates] = useState(messageTemplates)

  const handleSaveTemplates = async () => {
    try {
      await setMessageTemplates(localTemplates)
      toast({
        title: 'Templates Salvos',
        description: 'Os modelos de mensagem foram atualizados com sucesso.',
      })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar templates.', variant: 'destructive' })
    }
  }

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

  const allSessions = useMemo(() => mentees.flatMap((m) => m.sessions || []), [mentees])
  const totalSessionsCount = allSessions.length
  const realizedSessionsCount = allSessions.filter(
    (s) => s.status === 'Realizada' || (s.status !== 'Cancelada' && new Date(s.date) <= new Date()),
  ).length
  const sentRemindersCount = notificationLogs.filter(
    (l) => l.status === 'Enviado' || l.status === 'Entregue',
  ).length

  const sessionsPerWeek = useMemo(() => {
    const data = []
    for (let i = 4; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const weekStart = new Date(d)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const count = allSessions.filter((s) => {
        const sDate = new Date(s.date)
        return sDate >= weekStart && sDate <= weekEnd
      }).length

      data.push({
        name: `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
        Sessões: count,
      })
    }
    return data
  }, [allSessions])

  const flatSessionsFiltered = useMemo(() => {
    let list = mentees
      .flatMap((m) => (m.sessions || []).map((s) => ({ ...s, menteeName: m.name, menteeId: m.id })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (sessionsPeriod !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let start = new Date(today)
      let end = new Date(today)
      end.setHours(23, 59, 59, 999)

      if (sessionsPeriod === 'week') {
        start.setDate(today.getDate() - today.getDay())
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
      } else if (sessionsPeriod === 'month') {
        start.setDate(1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      }

      list = list.filter((s) => {
        if (!s.date) return false
        const d = new Date(s.date)
        return d >= start && d <= end
      })
    }
    return list
  }, [mentees, sessionsPeriod])

  const handleAddMentee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      newMentee.name &&
      newMentee.contractValue !== undefined &&
      newMentee.totalSessions !== undefined
    ) {
      try {
        await addMentee({
          ...newMentee,
          id: Math.random().toString(36).substr(2, 9),
          sessions: [],
          emailLogs: [],
        } as Mentee)
        toast({ title: 'Sucesso', description: 'Mentorado adicionado com sucesso.' })
        setIsAddingMentee(false)
        setNewMentee({
          name: '',
          company: companies[0] || '',
          contractValue: 0,
          totalSessions: 10,
          status: 'Ativo',
          phone: '',
          email: '',
        })
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro ao adicionar.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected && newSession.date) {
      try {
        await addMenteeSession(selected.id, {
          id: Math.random().toString(36).substr(2, 9),
          date: newSession.date,
          duration: Number(newSession.duration) || 60,
          discussion: newSession.discussion || '',
          tasks: newSession.tasks || '',
          type: newSession.type || 'Sessão Técnica',
          status: newSession.status || 'Agendada',
        } as Session)

        const newCount = (selected.sessions || []).length + 1
        if (newCount >= selected.totalSessions && selected.status !== 'Concluído') {
          await updateMentee(selected.id, { status: 'Concluído' })
        }
        toast({ title: 'Sucesso', description: 'Sessão registrada no prontuário.' })
        setIsAddingSession(false)
        setNewSession({
          date: '',
          duration: 60,
          discussion: '',
          tasks: '',
          type: 'Acompanhamento de Metas',
          status: 'Agendada',
        })
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro ao salvar a sessão.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleSaveSessionEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSession) {
      try {
        await updateMenteeSession(
          editingSession.menteeId,
          editingSession.session.id,
          editingSession.session,
        )
        toast({ title: 'Sessão Atualizada', description: 'As alterações da sessão foram salvas.' })
        setEditingSession(null)
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar as alterações.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleConfirmDeleteSession = async () => {
    if (sessionToDelete) {
      try {
        await removeMenteeSession(sessionToDelete.menteeId, sessionToDelete.sessionId)
        toast({ title: 'Sessão Removida', description: 'A sessão foi excluída do histórico.' })
        setSessionToDelete(null)
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir a sessão.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleExportIndividual = () => {
    if (!selected) return
    const data = (selected.sessions || []).map((s) => ({
      Mentorado: selected.name,
      Data: new Date(s.date).toLocaleString('pt-BR'),
      Duração: s.duration,
      Tipo: s.type || '-',
      Status: s.status || '-',
      Discussão: s.discussion,
      Tarefas: s.tasks,
    }))
    exportToCSV(`prontuario_${selected.name.replace(/\s+/g, '_')}.csv`, data)
  }

  const handleSaveMenteeEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (menteeToEdit) {
      try {
        await updateMentee(menteeToEdit.id, menteeToEdit)
        toast({ title: 'Mentoria Atualizada', description: 'Os dados foram salvos com sucesso.' })
        setMenteeToEdit(null)
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar a mentoria.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (menteeToDelete) {
      try {
        await removeMentee(menteeToDelete.id)
        toast({ title: 'Mentoria Removida', description: 'O registro foi excluído.' })
        if (selectedId === menteeToDelete.id) {
          setSelectedId(null)
        }
        setMenteeToDelete(null)
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Falha ao remover o registro.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleAddAvailability = async (e: React.FormEvent) => {
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
        toast({ title: 'Horário Adicionado', description: 'Sua disponibilidade foi atualizada.' })
        setNewSlotDate('')
        setNewSlotTime('')
        setNewSlotDescription('')
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Erro ao adicionar disponibilidade.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleSaveTimeSlotEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (timeSlotToEdit) {
      try {
        await updateTimeSlot(timeSlotToEdit.id, timeSlotToEdit)
        toast({
          title: 'Horário Atualizado',
          description: 'As alterações foram salvas e sincronizadas.',
        })
        setTimeSlotToEdit(null)
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar o horário.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleRemoveTimeSlot = async (id: string) => {
    try {
      await removeTimeSlot(id)
      toast({ title: 'Horário Removido', description: 'A disponibilidade foi removida da agenda.' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o horário.',
        variant: 'destructive',
      })
    }
  }

  const handleConfirmCancelBooking = async () => {
    if (bookingToCancel) {
      try {
        await unbookTimeSlot(bookingToCancel)
        toast({
          title: 'Agendamento Removido',
          description:
            'O agendamento foi excluído e o horário voltou a ficar disponível para novas reservas.',
        })
        setBookingToCancel(null)
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Não foi possível cancelar o agendamento.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleSendManualReminder = async () => {
    if (!selected || !selected.email) {
      toast({
        title: 'E-mail não cadastrado',
        description: 'Cadastre o e-mail do mentorado para enviar cobranças.',
        variant: 'destructive',
      })
      return
    }

    if (!emailConfig.apiKey || emailConfig.provider === 'Nenhum') {
      toast({
        title: 'Integração Inativa',
        description: 'A API de e-mail não está configurada em Configurações.',
        variant: 'destructive',
      })
      return
    }

    try {
      await addMenteeEmailLog(selected.id, {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        type: 'Lembrete Manual',
        subject: 'Aviso de Vencimento',
        status: 'Enviado',
      })
      toast({ title: 'E-mail Enviado', description: 'Lembrete enviado com sucesso via API.' })
    } catch (error) {
      toast({
        title: 'Erro no Envio',
        description: 'Ocorreu um erro ao tentar enviar o e-mail. Verifique a conexão.',
        variant: 'destructive',
      })
    }
  }

  const handleSaveReminderConfig = async () => {
    try {
      await setSessionReminderConfig(reminderConfig)
      setIsReminderDialogOpen(false)
      toast({
        title: 'Configurações de Lembrete',
        description: 'As regras de lembretes de sessões foram atualizadas com sucesso.',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações de lembrete.',
        variant: 'destructive',
      })
    }
  }

  const now = new Date()
  const upcomingSessions = (selected?.sessions || [])
    .filter((s) => {
      if (!s.date) return false
      return new Date(s.date) > now
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastSessions = (selected?.sessions || [])
    .filter((s) => {
      if (!s.date) return false
      return new Date(s.date) <= now
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6 animate-slide-up relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Mentorias</h1>
        <div className="flex items-center space-x-2 print:hidden w-full sm:w-auto justify-end flex-wrap gap-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReminderDialogOpen(true)}
            className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <Bell className="w-4 h-4 mr-2" /> Lembretes
          </Button>
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
          <Button
            onClick={() => setIsAddingMentee(true)}
            className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Mentorado
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-2">
          <TabsTrigger value="dashboard">Métricas</TabsTrigger>
          <TabsTrigger value="mentorados">Prontuários e Mentorados</TabsTrigger>
          <TabsTrigger value="todas_sessoes">Todas as Sessões</TabsTrigger>
          <TabsTrigger value="agenda">Disponibilidade e Agenda</TabsTrigger>
          <TabsTrigger value="mensagens">Configurações de Mensagem</TabsTrigger>
          <TabsTrigger value="logs">Logs de Notificação</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Mentorias</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSessionsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Sessões registradas no sistema</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realizedSessionsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Concluídas ou com data no passado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Lembretes Enviados</CardTitle>
                <Bell className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sentRemindersCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Notificações com sucesso</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Volume de Sessões (Últimas Semanas)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  Sessões: { color: 'hsl(var(--primary))', label: 'Sessões' },
                }}
                className="h-[250px] w-full"
              >
                <BarChart data={sessionsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltipContent />
                  <Bar
                    dataKey="Sessões"
                    fill="var(--color-Sessões)"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

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
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Pausado">Pausados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMentees.map((mentee) => {
              const sessionsCount = (mentee.sessions || []).length
              const progress = (sessionsCount / mentee.totalSessions) * 100
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
                            {sessionsCount} de {mentee.totalSessions}
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

        <TabsContent value="todas_sessoes" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Select value={sessionsPeriod} onValueChange={(v: any) => setSessionsPeriod(v)}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Sessões</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="day">Hoje</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Lista Global de Sessões</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Mentorado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatSessionsFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma sessão encontrada para o período selecionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    flatSessionsFiltered.map((s) => (
                      <TableRow key={`${s.menteeId}-${s.id}`}>
                        <TableCell>
                          {new Date(s.date).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{s.menteeName}</TableCell>
                        <TableCell>
                          {s.type && (
                            <Badge variant="secondary" className="font-normal text-[10px]">
                              {s.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{s.duration} min</TableCell>
                        <TableCell>
                          <StatusBadge status={s.status || 'Agendada'} className="text-[10px]" />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedId(s.menteeId)
                            }}
                          >
                            Abrir Prontuário
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                  <div className="space-y-2">
                    <Label htmlFor="desc" className="text-xs">
                      Descrição (Opcional)
                    </Label>
                    <Input
                      id="desc"
                      placeholder="Ex: Mentoria Individual"
                      value={newSlotDescription}
                      onChange={(e) => setNewSlotDescription(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSyncing}>
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Liberar Horário
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between">
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
                              <div>
                                <span>
                                  {new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
                                  {slot.time}
                                </span>
                                {slot.description && (
                                  <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                                    {slot.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => setTimeSlotToEdit(slot)}
                                disabled={isSyncing}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => handleRemoveTimeSlot(slot.id)}
                                disabled={isSyncing}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/20">
                <CardHeader className="pb-3 border-b border-border/50 bg-primary/5 flex flex-row items-center justify-between">
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
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-bold text-sm text-primary">
                                  {slot.menteeName}
                                </div>
                                {slot.menteeCompany && (
                                  <div className="text-xs font-medium text-foreground/80 mt-0.5">
                                    Empresa: {slot.menteeCompany}
                                  </div>
                                )}
                                {slot.description && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {slot.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-background whitespace-nowrap"
                                >
                                  {new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR')} •{' '}
                                  {slot.time}
                                </Badge>
                                {sessionReminderConfig?.enabled && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-100 ml-1">
                                        <BellRing className="w-3.5 h-3.5" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p className="text-xs">
                                        Lembrete: {sessionReminderConfig.hoursBefore}h antes via{' '}
                                        {sessionReminderConfig.channels.email ? 'E-mail' : ''}
                                        {sessionReminderConfig.channels.email &&
                                        sessionReminderConfig.channels.whatsapp
                                          ? ' e '
                                          : ''}
                                        {sessionReminderConfig.channels.whatsapp ? 'WhatsApp' : ''}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 shrink-0 ml-1"
                                      disabled={isSyncing}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setTimeSlotToEdit(slot)}>
                                      <Edit className="w-4 h-4 mr-2" /> Editar Horário
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setBookingToCancel(slot.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Excluir Agendamento
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {slot.menteeEmail && (
                              <a
                                href={`mailto:${slot.menteeEmail}`}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center mt-1"
                              >
                                <Mail className="w-3 h-3 mr-1" /> {slot.menteeEmail}
                              </a>
                            )}
                            {slot.menteePhone && (
                              <a
                                href={`https://wa.me/${slot.menteePhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center mt-1"
                              >
                                <Phone className="w-3 h-3 mr-1" /> {slot.menteePhone}
                              </a>
                            )}
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

        <TabsContent value="mensagens" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Configurações de Mensagem</CardTitle>
              <CardDescription>
                Personalize os templates usados para o envio de lembretes aos mentorados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assunto do E-mail</Label>
                <Input
                  value={localTemplates.emailSubject}
                  onChange={(e) =>
                    setLocalTemplates({ ...localTemplates, emailSubject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Corpo do E-mail</Label>
                <Textarea
                  className="h-32 resize-none"
                  value={localTemplates.emailBody}
                  onChange={(e) =>
                    setLocalTemplates({ ...localTemplates, emailBody: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: {'{{nome_mentorado}}'}, {'{{data_sessao}}'}, {'{{horario_sessao}}'},{' '}
                  {'{{link_reuniao}}'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Mensagem do WhatsApp</Label>
                <Textarea
                  className="h-24 resize-none"
                  value={localTemplates.whatsappBody}
                  onChange={(e) =>
                    setLocalTemplates({ ...localTemplates, whatsappBody: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Mesmas variáveis do e-mail são suportadas.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Link Padrão da Reunião</Label>
                <Input
                  value={localTemplates.defaultMeetingLink}
                  onChange={(e) =>
                    setLocalTemplates({ ...localTemplates, defaultMeetingLink: e.target.value })
                  }
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <Button onClick={handleSaveTemplates} className="mt-4" disabled={isSyncing}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />} Salvar Templates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Histórico de Notificações</CardTitle>
              <CardDescription>
                Registro de todos os lembretes enviados aos mentorados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Mentorado</TableHead>
                    <TableHead>Data de Envio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhuma notificação registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    notificationLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.menteeName}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{log.channel}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === 'Falha' ? 'destructive' : 'outline'}
                            className={cn(
                              log.status === 'Entregue' || log.status === 'Enviado'
                                ? 'border-green-200 text-green-700 bg-green-50'
                                : '',
                            )}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lembretes de Sessão</DialogTitle>
            <DialogDescription>
              Configure alertas automáticos para avisar seus mentorados sobre os agendamentos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Habilitar Lembretes Automáticos</Label>
                <p className="text-xs text-muted-foreground">
                  Ativa o envio automático de avisos antes das sessões.
                </p>
              </div>
              <Switch
                checked={reminderConfig.enabled}
                onCheckedChange={(c) => setReminderConfig({ ...reminderConfig, enabled: c })}
              />
            </div>

            {reminderConfig.enabled && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Antecedência do Aviso
                  </Label>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm">Enviar lembrete</span>
                    <Input
                      type="number"
                      min="1"
                      max="72"
                      value={reminderConfig.hoursBefore}
                      onChange={(e) =>
                        setReminderConfig({
                          ...reminderConfig,
                          hoursBefore: Number(e.target.value) || 1,
                        })
                      }
                      className="w-20 text-center h-9"
                    />
                    <span className="text-sm">horas antes da mentoria</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Canais de Notificação
                  </Label>
                  <div className="flex flex-col gap-3 bg-muted/20 p-4 rounded-lg border border-border/50">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="email-channel"
                        checked={reminderConfig.channels.email}
                        onCheckedChange={(c) =>
                          setReminderConfig({
                            ...reminderConfig,
                            channels: { ...reminderConfig.channels, email: !!c },
                          })
                        }
                      />
                      <Label
                        htmlFor="email-channel"
                        className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        E-mail
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="whatsapp-channel"
                        checked={reminderConfig.channels.whatsapp}
                        onCheckedChange={(c) =>
                          setReminderConfig({
                            ...reminderConfig,
                            channels: { ...reminderConfig.channels, whatsapp: !!c },
                          })
                        }
                      />
                      <Label
                        htmlFor="whatsapp-channel"
                        className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Mensagem (WhatsApp/SMS)
                      </Label>
                    </div>
                    {!reminderConfig.channels.email && !reminderConfig.channels.whatsapp && (
                      <p className="text-[10px] text-destructive pt-1 font-medium">
                        Atenção: Selecione pelo menos um canal de envio.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveReminderConfig}
              disabled={
                isSyncing ||
                (reminderConfig.enabled &&
                  !reminderConfig.channels.email &&
                  !reminderConfig.channels.whatsapp)
              }
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />} Salvar
              Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingMentee} onOpenChange={setIsAddingMentee}>
        <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Novo Mentorado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMentee} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="new-name">Nome do Mentorado</Label>
                <Input
                  id="new-name"
                  value={newMentee.name}
                  onChange={(e) => setNewMentee({ ...newMentee, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-phone">WhatsApp</Label>
                <Input
                  id="new-phone"
                  value={newMentee.phone}
                  onChange={(e) => setNewMentee({ ...newMentee, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-email">E-mail</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newMentee.email}
                  onChange={(e) => setNewMentee({ ...newMentee, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-contractValue">Valor do Contrato (R$)</Label>
                <Input
                  id="new-contractValue"
                  type="number"
                  step="0.01"
                  value={newMentee.contractValue}
                  onChange={(e) =>
                    setNewMentee({ ...newMentee, contractValue: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-totalSessions">Total de Sessões</Label>
                <Input
                  id="new-totalSessions"
                  type="number"
                  value={newMentee.totalSessions}
                  onChange={(e) =>
                    setNewMentee({ ...newMentee, totalSessions: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-company">Empresa Vinculada</Label>
                <Select
                  value={newMentee.company}
                  onValueChange={(val) => setNewMentee({ ...newMentee, company: val })}
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
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddingMentee(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSyncing}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Mentorado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!timeSlotToEdit} onOpenChange={(open) => !open && setTimeSlotToEdit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Horário</DialogTitle>
            <DialogDescription>
              Atualize a data, hora ou descrição do agendamento. Refletirá publicamente.
            </DialogDescription>
          </DialogHeader>
          {timeSlotToEdit && (
            <form onSubmit={handleSaveTimeSlotEdit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    required
                    value={timeSlotToEdit.date}
                    onChange={(e) => setTimeSlotToEdit({ ...timeSlotToEdit, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    required
                    value={timeSlotToEdit.time}
                    onChange={(e) => setTimeSlotToEdit({ ...timeSlotToEdit, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição / Tipo de Mentoria</Label>
                <Input
                  placeholder="Ex: Reunião de Diagnóstico"
                  value={timeSlotToEdit.description || ''}
                  onChange={(e) =>
                    setTimeSlotToEdit({ ...timeSlotToEdit, description: e.target.value })
                  }
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setTimeSlotToEdit(null)}>
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

      <AlertDialog
        open={!!bookingToCancel}
        onOpenChange={(open) => !open && setBookingToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? O horário voltará a ficar disponível
              na sua página pública para que outros possam reservá-lo. O horário base não será
              deletado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelBooking}
              disabled={isSyncing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Excluir Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                        value={((selected.sessions || []).length / selected.totalSessions) * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="font-bold text-[11px] text-foreground/90">
                        {(selected.sessions || []).length}/{selected.totalSessions}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <Tabs defaultValue="prontuario" className="w-full h-full">
                  <div className="px-6 pt-4 border-b">
                    <TabsList className="bg-transparent space-x-2">
                      <TabsTrigger
                        value="prontuario"
                        className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4"
                      >
                        Prontuário
                      </TabsTrigger>
                      <TabsTrigger
                        value="comunicacao"
                        className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4"
                      >
                        Comunicações
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="prontuario" className="p-6 space-y-8 m-0 outline-none">
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
                              className="group relative flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg"
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
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {s.type && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] bg-background"
                                      >
                                        {s.type}
                                      </Badge>
                                    )}
                                    <StatusBadge
                                      status={s.status || 'Agendada'}
                                      className="text-[10px] py-0 px-1.5"
                                    />
                                  </div>
                                  {s.discussion && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {s.discussion}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {sessionReminderConfig?.enabled && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 mr-2 cursor-help">
                                        <BellRing className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">Lembrete Ativo</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Será enviado {sessionReminderConfig.hoursBefore}h antes via{' '}
                                      {sessionReminderConfig.channels.email ? 'E-mail' : ''}
                                      {sessionReminderConfig.channels.email &&
                                      sessionReminderConfig.channels.whatsapp
                                        ? ' e '
                                        : ''}
                                      {sessionReminderConfig.channels.whatsapp ? 'WhatsApp' : ''}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() =>
                                      setEditingSession({ menteeId: selected.id, session: s })
                                    }
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      setSessionToDelete({ menteeId: selected.id, sessionId: s.id })
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[10px]"
                                  asChild
                                >
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
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
                                Tipo/Categoria da Sessão
                              </Label>
                              <Select
                                value={newSession.type}
                                onValueChange={(val) => setNewSession({ ...newSession, type: val })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SESSION_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
                                Status da Sessão
                              </Label>
                              <Select
                                value={newSession.status || 'Agendada'}
                                onValueChange={(val) =>
                                  setNewSession({ ...newSession, status: val })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SESSION_STATUSES.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase font-semibold text-muted-foreground">
                              Notas da Sessão (Prontuário)
                            </Label>
                            <Textarea
                              required
                              placeholder="Descreva o que foi falado na sessão, evoluções e pontos de atenção..."
                              className="text-xs resize-none h-20"
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
                              disabled={isSyncing}
                            >
                              {isSyncing && <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />}
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
                                className="group relative pl-6 pb-2 border-l-2 border-border last:border-0 last:pb-0"
                              >
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-muted border-2 border-background rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-primary/50 rounded-full" />
                                </div>
                                <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-primary bg-background/80"
                                    onClick={() =>
                                      setEditingSession({ menteeId: selected.id, session: s })
                                    }
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive bg-background/80"
                                    onClick={() =>
                                      setSessionToDelete({ menteeId: selected.id, sessionId: s.id })
                                    }
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="bg-card border rounded-lg p-4 shadow-sm">
                                  <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-foreground/90">
                                        Sessão {sessionIndex}
                                      </span>
                                      {s.type && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] font-normal flex items-center gap-1 py-0 px-1.5"
                                        >
                                          <Tag className="w-2.5 h-2.5" /> {s.type}
                                        </Badge>
                                      )}
                                      <StatusBadge
                                        status={s.status || 'Realizada'}
                                        className="text-[10px] py-0 px-1.5"
                                      />
                                    </div>
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
                                          Notas do Prontuário:
                                        </span>
                                        <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap bg-muted/30 p-2 rounded border border-border/50">
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
                  </TabsContent>

                  <TabsContent value="comunicacao" className="p-6 space-y-6 m-0 outline-none">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center text-foreground/90">
                        <Mail className="w-4 h-4 mr-2 text-primary" /> Log de Automações e E-mails
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendManualReminder}
                        className="h-8 text-xs"
                      >
                        <Send className="w-3.5 h-3.5 mr-2" /> Enviar Cobrança Manual
                      </Button>
                    </div>

                    {!selected.emailLogs || selected.emailLogs.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                        Nenhuma comunicação registrada.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selected.emailLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-card border rounded-lg shadow-sm flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold leading-none mb-1">
                                {log.subject}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground gap-2">
                                <span>{new Date(log.date).toLocaleString('pt-BR')}</span>
                                <span>•</span>
                                <span className="font-medium text-foreground/70">{log.type}</span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                log.status === 'Enviado'
                                  ? 'border-green-200 text-green-700 bg-green-50'
                                  : 'border-red-200 text-red-700 bg-red-50',
                              )}
                            >
                              {log.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Sessão</DialogTitle>
            <DialogDescription>Atualize as informações da sessão no prontuário.</DialogDescription>
          </DialogHeader>
          {editingSession && (
            <form onSubmit={handleSaveSessionEdit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    required
                    className="text-xs h-9"
                    value={formatDateTimeLocal(editingSession.session.date)}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        session: { ...editingSession.session, date: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Duração (min)
                  </Label>
                  <Input
                    type="number"
                    required
                    className="text-xs h-9"
                    value={editingSession.session.duration}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        session: { ...editingSession.session, duration: Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Tipo/Categoria da Sessão
                  </Label>
                  <Select
                    value={editingSession.session.type || 'Acompanhamento de Metas'}
                    onValueChange={(val) =>
                      setEditingSession({
                        ...editingSession,
                        session: { ...editingSession.session, type: val },
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                  <Select
                    value={editingSession.session.status || 'Agendada'}
                    onValueChange={(val) =>
                      setEditingSession({
                        ...editingSession,
                        session: { ...editingSession.session, status: val },
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Notas do Prontuário
                </Label>
                <Textarea
                  required
                  className="text-xs resize-none h-20"
                  value={editingSession.session.discussion}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      session: { ...editingSession.session, discussion: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Combinados / Tarefas
                </Label>
                <Textarea
                  className="text-xs resize-none h-16"
                  value={editingSession.session.tasks}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      session: { ...editingSession.session, tasks: e.target.value },
                    })
                  }
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingSession(null)}>
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

      <AlertDialog
        open={!!sessionToDelete}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão do prontuário? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSession}
              disabled={isSyncing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <Button type="submit" disabled={isSyncing}>
                  {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
              disabled={isSyncing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
