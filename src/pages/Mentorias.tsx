import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mentee } from '@/lib/types'
import { Calendar, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Mentorias() {
  const { company, mentees } = useMainStore()
  const [selected, setSelected] = useState<Mentee | null>(null)

  const filtered = useMemo(
    () => (company === 'Todas' ? mentees : mentees.filter((m) => m.company === company)),
    [company, mentees],
  )

  const handleSyncCalendar = () => {
    toast({ title: 'Sincronizado!', description: 'Sessão agendada no Google Agenda com sucesso.' })
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Controle de Mentorias</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mentee) => {
          const progress = (mentee.sessions.length / mentee.totalSessions) * 100
          return (
            <Card
              key={mentee.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelected(mentee)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{mentee.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{mentee.company}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>Sessões Concluídas</span>
                  <span>
                    {mentee.sessions.length} de {mentee.totalSessions}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-end pt-2">
                  <span className="text-xs font-bold text-primary">
                    R$ {mentee.contractValue.toLocaleString('pt-BR')}
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
            <SheetTitle className="text-2xl">Prontuário: {selected?.name}</SheetTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <span className="font-medium mr-4">
                Valor Contratado: R$ {selected?.contractValue.toLocaleString('pt-BR')}
              </span>
              <span>
                Progresso: {selected?.sessions.length}/{selected?.totalSessions}
              </span>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-accent" /> Histórico de Sessões
                </h3>
                <Button size="sm" variant="outline" onClick={handleSyncCalendar}>
                  <Calendar className="w-4 h-4 mr-2" /> Sincronizar Agenda
                </Button>
              </div>

              {selected?.sessions.map((s, i) => (
                <div
                  key={s.id}
                  className="relative pl-6 pb-6 border-l-2 border-primary/20 last:border-0 last:pb-0"
                >
                  <div className="absolute -left-[9px] top-0 bg-background rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-sm">Sessão {i + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.date).toLocaleDateString('pt-BR')} • {s.duration} min
                      </span>
                    </div>
                    <div className="space-y-3 mt-3">
                      <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          O que foi discutido:
                        </span>
                        <p className="text-sm mt-1">{s.discussion}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          Combinados / Tarefas:
                        </span>
                        <p className="text-sm mt-1">{s.tasks}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                + Adicionar Nova Sessão
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
