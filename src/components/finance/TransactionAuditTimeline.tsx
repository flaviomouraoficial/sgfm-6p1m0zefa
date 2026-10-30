import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PlusCircle, Edit3, Trash2, Shield, Clock, User, ArrowRight } from 'lucide-react'

export type TransactionAudit = {
  id: string
  transaction_id?: string
  user_id?: string
  user_name?: string
  user_email?: string
  action: 'create' | 'update' | 'delete'
  field_changed?: string
  old_value?: string
  new_value?: string
  details?: any
  created: string
  updated: string
}

interface TransactionAuditTimelineProps {
  transactionId?: string
}

export function TransactionAuditTimeline({ transactionId }: TransactionAuditTimelineProps) {
  const [audits, setAudits] = useState<TransactionAudit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!transactionId) {
      setAudits([])
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    pb.collection('v1_transaction_audits')
      .getFullList<TransactionAudit>({
        filter: `transaction_id = "${transactionId}"`,
        sort: '-created',
      })
      .then((records) => {
        if (isMounted) {
          setAudits(records)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Erro ao buscar auditoria da transação:', err)
          setError('Não foi possível carregar o histórico de auditoria.')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [transactionId])

  if (!transactionId) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
        O histórico de alterações estará disponível após a criação da transação.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span>Carregando histórico de auditoria...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4 px-3 text-xs text-destructive bg-destructive/10 rounded-md">{error}</div>
    )
  }

  if (audits.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center justify-center gap-1">
        <Clock className="w-5 h-5 text-muted-foreground/60 mb-1" />
        <span className="font-medium text-foreground">Nenhuma alteração registrada ainda</span>
        <span>
          As alterações subsequentes feitas nesta transação serão registradas automaticamente.
        </span>
      </div>
    )
  }

  const getActionBadge = (action: TransactionAudit['action']) => {
    switch (action) {
      case 'create':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[10px] font-semibold">
            <PlusCircle className="w-3 h-3" /> Criação
          </Badge>
        )
      case 'update':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-[10px] font-semibold">
            <Edit3 className="w-3 h-3" /> Edição
          </Badge>
        )
      case 'delete':
        return (
          <Badge variant="destructive" className="gap-1 text-[10px] font-semibold">
            <Trash2 className="w-3 h-3" /> Exclusão
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Trilha de Auditoria e Conformidade</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {audits.length} {audits.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <ScrollArea className="max-h-[280px] pr-3">
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {audits.map((item) => {
            const dateObj = new Date(item.created)
            const formattedDate = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })

            // Normaliza details se for array de diffs
            const diffs = Array.isArray(item.details) ? item.details : null

            return (
              <div key={item.id} className="relative group">
                {/* Marcador na timeline */}
                <span className="absolute -left-6 top-1.5 flex h-3 w-3 rounded-full bg-primary ring-4 ring-background" />

                <div className="p-3 rounded-lg border bg-card/60 hover:bg-card transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getActionBadge(item.action)}
                      <span className="text-xs font-medium text-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {item.user_name || item.user_email || 'Sistema'}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formattedDate} às {formattedTime}
                    </span>
                  </div>

                  {item.action === 'create' && (
                    <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                      <span className="font-medium text-foreground">Transação criada:</span>{' '}
                      {item.new_value || item.details?.description || 'Lançamento inicial'}
                    </div>
                  )}

                  {item.action === 'delete' && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                      <span className="font-medium">Registro removido:</span>{' '}
                      {item.old_value || 'Transação excluída'}
                    </div>
                  )}

                  {item.action === 'update' && (
                    <div className="space-y-1 text-xs">
                      {diffs && diffs.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {diffs.map((diff: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-muted/40 p-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                            >
                              <span className="font-semibold text-foreground min-w-[90px]">
                                {diff.field}:
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="line-through text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/40">
                                  {diff.oldVal || '(vazio)'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                                <span className="font-medium text-foreground bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                  {diff.newVal || '(vazio)'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-muted/40 p-2 rounded space-y-1 text-[11px]">
                          <div className="text-muted-foreground">
                            <span className="font-medium text-foreground">Campos:</span>{' '}
                            {item.field_changed}
                          </div>
                          {item.old_value && (
                            <div className="line-through text-muted-foreground">
                              Anterior: {item.old_value}
                            </div>
                          )}
                          {item.new_value && (
                            <div className="text-primary font-medium">Novo: {item.new_value}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
