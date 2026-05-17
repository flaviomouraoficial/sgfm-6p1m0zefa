import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function MentoradoViewDialog({ mentee, isOpen, onClose }: any) {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && mentee) {
      setLoading(true)
      pb.collection('v1_agendamentos')
        .getFullList({ filter: `mentee_id = "${mentee.id}"`, sort: '-data_horario' })
        .then((records) => setAgendamentos(records))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [mentee, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sessões de {mentee?.name}</DialogTitle>
          <DialogDescription>
            Histórico de sessões e agendamentos vinculados a este mentorado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Buscando sessões...</p>
          ) : agendamentos.length === 0 ? (
            <div className="text-center p-6 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground text-sm">
                Nenhuma sessão associada a este mentorado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentos.map((a) => (
                <div
                  key={a.id}
                  className="border p-4 rounded-lg flex items-center justify-between bg-card/50"
                >
                  <div>
                    <div className="font-semibold text-foreground">
                      {a.data_horario
                        ? new Intl.DateTimeFormat('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(a.data_horario))
                        : 'Sem data definida'}
                    </div>
                    {a.cliente_telefone && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Contato: {a.cliente_telefone}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                      {a.status || 'Pendente'}
                    </span>
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
