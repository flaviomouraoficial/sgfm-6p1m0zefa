import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, RefreshCw, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Agendar() {
  const { timeSlots, addTimeSlot, updateTimeSlot, removeTimeSlot, isSyncing } = useMainStore()

  const [menteeName, setMenteeName] = useState('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState('')
  const [topic, setTopic] = useState('')

  const scheduledSessions = useMemo(() => {
    return timeSlots
      .filter((t) => t.isBooked)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
        return dateA.getTime() - dateB.getTime()
      })
  }, [timeSlots])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menteeName || !date || !time) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Preencha o Nome do Mentorado, Data e Horário.',
        variant: 'destructive',
      })
      return
    }

    try {
      await addTimeSlot({
        id: Math.random().toString(36).substring(2, 9),
        date: format(date, 'yyyy-MM-dd'),
        time,
        description: topic,
        isBooked: true,
        menteeName,
        menteeEmail: '',
        menteeCompany: '',
        status: 'Agendado',
      } as any)

      toast({
        title: 'Agendamento Confirmado',
        description: 'A sessão de mentoria foi agendada com sucesso.',
      })
      setMenteeName('')
      setDate(undefined)
      setTime('')
      setTopic('')
    } catch (error) {
      toast({
        title: 'Erro ao Agendar',
        description: 'Não foi possível salvar o agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateTimeSlot(id, { status: newStatus } as any)
      toast({ title: 'Status Atualizado', description: `Sessão marcada como ${newStatus}.` })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar o status.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeTimeSlot(id)
      toast({ title: 'Agendamento Removido', description: 'A sessão foi excluída.' })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir o agendamento.',
        variant: 'destructive',
      })
    }
  }

  const getStatus = (slot: any) => {
    if (slot.status) return slot.status
    return 'Agendado'
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">
            Agendamento de Mentorados
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e organize as sessões de mentoria de forma independente.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6 items-start">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Nova Sessão</CardTitle>
            <CardDescription>Cadastre um novo agendamento para um mentorado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="menteeName">Nome do Mentorado *</Label>
                <Input
                  id="menteeName"
                  placeholder="Ex: João Silva"
                  value={menteeName}
                  onChange={(e) => setMenteeName(e.target.value)}
                  disabled={isSyncing}
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Data da Sessão *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                      )}
                      disabled={isSyncing}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isSyncing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Tópico da Mentoria</Label>
                <Textarea
                  id="topic"
                  placeholder="Descreva o assunto principal da sessão..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isSyncing}
                  className="resize-none h-20"
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSyncing}>
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CalendarIcon className="w-4 h-4 mr-2" />
                )}
                Confirmar Agendamento
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Sessões Agendadas</CardTitle>
            <CardDescription>Acompanhe os próximos encontros de mentoria.</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <CheckCircle2 className="w-10 h-10 mb-3 opacity-20" />
                <p>Nenhuma sessão agendada no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledSessions.map((session) => {
                  const status = getStatus(session)
                  return (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between p-4 bg-card border rounded-lg shadow-sm gap-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-base leading-none">
                            {session.menteeName}
                          </h4>
                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase',
                              status === 'Concluído'
                                ? 'bg-green-100 text-green-700'
                                : status === 'Reagendado'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700',
                            )}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground font-medium">
                          <span className="flex items-center">
                            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                            {new Date(session.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            {session.time}
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-sm mt-3 bg-muted/30 p-2 rounded-md border border-border/50 text-foreground/80">
                            {session.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {status !== 'Concluído' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(session.id, 'Concluído')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Concluir
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(session.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
