import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useRealtime } from '@/hooks/use-realtime'
import { Calendar as CalendarIcon, FileText, Clock, Briefcase, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function MentoradoViewDialog({ mentee, isOpen, onClose }: any) {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [sessoes, setSessoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!isOpen || !mentee) return
    setLoading(true)
    try {
      const [ag, sess] = await Promise.all([
        pb
          .collection('v1_agendamentos')
          .getFullList({
            filter: `mentee_id = "${mentee.id}"`,
            sort: '-data_horario',
            expand: 'servico_id',
          }),
        pb
          .collection('v1_sessoes')
          .getFullList({ filter: `mentee_id = "${mentee.id}"`, sort: '-date' }),
      ])
      setAgendamentos(ag)
      setSessoes(sess)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [mentee, isOpen])

  useRealtime('v1_agendamentos', () => {
    if (isOpen) fetchData()
  })

  useRealtime('v1_sessoes', () => {
    if (isOpen) fetchData()
  })

  const timeline = [
    ...agendamentos.map((a) => ({
      id: `ag-${a.id}`,
      type: 'agendamento' as const,
      date: a.data_horario,
      title: a.expand?.servico_id?.nome || 'Agendamento',
      status: a.status,
      details: a.cliente_telefone ? `Contato: ${a.cliente_telefone}` : '',
      original: a,
    })),
    ...sessoes.map((s) => ({
      id: `sess-${s.id}`,
      type: 'sessao' as const,
      date: s.date,
      title: s.type || 'Sessão / Prontuário',
      status: s.status,
      details: s.notes || s.discussion || '',
      projeto: s.projeto,
      original: s,
    })),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2D9289] flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Linha do Tempo de {mentee?.name}
            </DialogTitle>
            <DialogDescription>
              Histórico consolidado de agendamentos e prontuários (sessões).
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#2D9289]/20 border-t-[#2D9289] rounded-full animate-spin"></div>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-lg bg-white">
              <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-foreground font-medium">Nenhum registro encontrado</p>
              <p className="text-muted-foreground text-sm mt-1">
                Agendamentos e prontuários deste mentorado aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10',
                      item.type === 'agendamento'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-teal-100 text-[#2D9289]',
                    )}
                  >
                    {item.type === 'agendamento' ? (
                      <CalendarIcon className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>

                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          item.type === 'agendamento'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-teal-50 border-teal-200 text-[#2D9289]',
                        )}
                      >
                        {item.type === 'agendamento' ? 'Agenda' : 'Prontuário'}
                      </Badge>
                    </div>
                    <time className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {item.date
                        ? new Intl.DateTimeFormat('pt-BR', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(item.date))
                        : 'Sem data definida'}
                    </time>
                    {item.projeto && (
                      <div className="text-xs text-slate-600 mb-2 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {item.projeto}
                      </div>
                    )}
                    {item.details && (
                      <div className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-md line-clamp-3">
                        {item.details}
                      </div>
                    )}
                    <div className="mt-3 flex items-center">
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          item.status === 'Concluída' || item.status === 'Realizado'
                            ? 'text-green-600'
                            : item.status === 'Agendada' || item.status === 'Pendente'
                              ? 'text-amber-600'
                              : 'text-slate-500',
                        )}
                      >
                        ● {item.status || 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
