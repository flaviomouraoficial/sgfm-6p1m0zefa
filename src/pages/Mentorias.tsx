import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { exportToCSV, generateGoogleCalendarLink } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mentee, Session } from '@/lib/types'
import { Calendar, FileText, CheckCircle2, Download, Printer } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Mentorias() {
  const { company, mentees, addMenteeSession } = useMainStore()
  const [selected, setSelected] = useState<Mentee | null>(null)
  const [isAddingSession, setIsAddingSession] = useState(false)
  const [newSession, setNewSession] = useState<Partial<Session>>({
    date: '',
    duration: 60,
    discussion: '',
    tasks: '',
  })

  const filtered = useMemo(
    () => (company === 'Todas' ? mentees : mentees.filter((m) => m.company === company)),
    [company, mentees],
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
      toast({ title: 'Sucesso', description: 'Sessão registrada no prontuário.' })
      setIsAddingSession(false)
      setNewSession({ date: '', duration: 60, discussion: '', tasks: '' })
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Controle de Mentorias</h1>
        <div className="flex items-center space-x-2 print:hidden">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mentee) => {
          const progress = (mentee.sessions.length / mentee.totalSessions) * 100
          return (
            <Card
              key={mentee.id}
              className="hover:border-primary/50 transition-colors cursor-pointer shadow-sm"
              onClick={() => setSelected(mentee)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{mentee.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{mentee.company}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <span>Sessões Concluídas</span>
                  <span>
                    {mentee.sessions.length} de {mentee.totalSessions}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-end pt-2 border-t border-border/50">
                  <span className="text-xs font-bold text-primary">
                    R$ {mentee.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl md:w-[600px] p-0 flex flex-col border-l">
          <SheetHeader className="p-6 border-b bg-muted/20">
            <SheetTitle className="text-xl flex items-center">
              <FileText className="w-5 h-5 mr-2 text-accent" />
              Prontuário: {selected?.name}
            </SheetTitle>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground mt-2 gap-2 sm:gap-4">
              <span className="font-medium bg-background px-2 py-1 rounded border">
                Valor: R${' '}
                {selected?.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="bg-background px-2 py-1 rounded border">
                Progresso: {selected?.sessions.length}/{selected?.totalSessions}
              </span>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {isAddingSession ? (
                <form
                  onSubmit={handleAddSession}
                  className="bg-muted/30 p-4 rounded-lg border space-y-4"
                >
                  <h4 className="font-semibold text-sm">Registrar Nova Sessão</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Data e Hora</Label>
                      <Input
                        type="datetime-local"
                        required
                        className="text-xs h-8"
                        value={newSession.date}
                        onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duração (min)</Label>
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
                  <div className="space-y-1">
                    <Label className="text-xs">Assuntos Discutidos</Label>
                    <Textarea
                      required
                      className="text-xs resize-none h-20"
                      value={newSession.discussion}
                      onChange={(e) => setNewSession({ ...newSession, discussion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Combinados / Tarefas</Label>
                    <Textarea
                      className="text-xs resize-none h-16"
                      value={newSession.tasks}
                      onChange={(e) => setNewSession({ ...newSession, tasks: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingSession(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Salvar Sessão
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  onClick={() => setIsAddingSession(true)}
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 border border-dashed"
                >
                  + Adicionar Novo Registro
                </Button>
              )}

              <div className="space-y-4 mt-8">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-4">
                  Histórico
                </h3>
                {[...(selected?.sessions || [])].reverse().map((s, i) => {
                  const sessionIndex = (selected?.sessions.length || 0) - i
                  return (
                    <div
                      key={s.id}
                      className="relative pl-6 pb-6 border-l-2 border-primary/20 last:border-0 last:pb-0"
                    >
                      <div className="absolute -left-[9px] top-0 bg-background rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                          <span className="font-bold text-sm text-foreground/90">
                            Sessão {sessionIndex}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                              {new Date(s.date).toLocaleString('pt-BR')} • {s.duration} min
                            </span>
                            <a
                              href={generateGoogleCalendarLink(
                                `Mentoria: ${selected?.name}`,
                                s.date,
                                s.duration,
                                s.discussion,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center font-medium bg-blue-50 px-1.5 py-0.5 rounded"
                            >
                              <Calendar className="w-3 h-3 mr-1" /> Add Agenda
                            </a>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-muted/20 p-2.5 rounded-md border border-border/50">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                              Discussão:
                            </span>
                            <p className="text-xs leading-relaxed text-foreground/80">
                              {s.discussion}
                            </p>
                          </div>
                          {s.tasks && (
                            <div className="bg-muted/20 p-2.5 rounded-md border border-border/50">
                              <span className="text-[10px] font-semibold uppercase text-muted-foreground block mb-1">
                                Combinados:
                              </span>
                              <p className="text-xs leading-relaxed text-foreground/80">
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
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
