import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar as CalendarIcon, RefreshCw, Trash2, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Agendar() {
  const { timeSlots, addTimeSlot, removeTimeSlot, isSyncing } = useMainStore()

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
        return dateB.getTime() - dateA.getTime() // Most recent first
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
      })

      toast({
        title: 'Sucesso',
        description: 'Agendamento salvo com sucesso.',
      })
      setMenteeName('')
      setDate(undefined)
      setTime('')
      setTopic('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeTimeSlot(id)
      toast({ title: 'Removido', description: 'O agendamento foi excluído.' })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir o agendamento.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Agendar Mentoria</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os agendamentos e acompanhe o histórico de sessões.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>Cadastre uma nova sessão com seu mentorado.</CardDescription>
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
                <Label htmlFor="time">Horário (Início) *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isSyncing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Tópico / Assunto da Sessão</Label>
                <Textarea
                  id="topic"
                  placeholder="Descreva o foco principal da mentoria..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isSyncing}
                  className="resize-none h-24"
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSyncing}>
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CalendarIcon className="w-4 h-4 mr-2" />
                )}
                Salvar Agendamento
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/10 border-b">
            <CardTitle>Histórico de Agendamentos</CardTitle>
            <CardDescription>Lista de lançamentos feitos (futuros e passados).</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {scheduledSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mb-3 opacity-20" />
                <p>Nenhum agendamento registrado no momento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="font-semibold">Mentorado</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Início</TableHead>
                    <TableHead className="font-semibold">Tópico/Assunto</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledSessions.map((session) => (
                    <TableRow key={session.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        {session.menteeName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(session.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          {session.time}
                        </div>
                      </TableCell>
                      <TableCell
                        className="max-w-[180px] truncate text-muted-foreground"
                        title={session.description}
                      >
                        {session.description || (
                          <span className="italic opacity-50">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(session.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          title="Excluir Agendamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
