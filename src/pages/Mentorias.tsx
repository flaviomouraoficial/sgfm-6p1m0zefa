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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mentee, Session, MenteeStatus } from '@/lib/types'
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
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

function StatusBadge({ status, className }: { status: MenteeStatus; className?: string }) {
  if (status === 'Ativo') {
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
  }
  if (status === 'Concluído') {
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
  }
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
  const { company, mentees, addMenteeSession, updateMentee } = useMainStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAddingSession, setIsAddingSession] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')

  const selected = useMemo(
    () => mentees.find((m) => m.id === selectedId) || null,
    [mentees, selectedId],
  )

  const [newSession, setNewSession] = useState<Partial<Session>>({
    date: '',
    duration: 60,
    discussion: '',
    tasks: '',
  })

  const filtered = useMemo(() => {
    let res = company === 'Todas' ? mentees : mentees.filter((m) => m.company === company)
    if (statusFilter !== 'Todos') res = res.filter((m) => m.status === statusFilter)
    if (searchQuery)
      res = res.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return res
  }, [company, mentees, statusFilter, searchQuery])

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
        <h1 className="text-2xl font-bold tracking-tight">Controle de Mentorias</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
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

          <div className="flex items-center space-x-2 print:hidden w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV('mentorias.csv', filtered)}
              className="h-9"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mentee) => {
          const progress = (mentee.sessions.length / mentee.totalSessions) * 100
          return (
            <Card
              key={mentee.id}
              className="hover:border-primary/50 transition-colors cursor-pointer shadow-sm group"
              onClick={() => setSelectedId(mentee.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {mentee.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">{mentee.company}</CardDescription>
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
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            Nenhum mentorando encontrado com os filtros atuais.
          </div>
        )}
      </div>

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
    </div>
  )
}
