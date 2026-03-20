import { useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, cn } from '@/lib/utils'
import {
  Calendar,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

export default function PortalDashboard() {
  const { menteeAuth, mentees, transactions, isInitialLoad } = useMainStore()

  const mentee = useMemo(
    () => mentees.find((m) => m.id === menteeAuth.menteeId),
    [mentees, menteeAuth.menteeId],
  )

  const menteeTransactions = useMemo(() => {
    if (!mentee) return []
    return transactions
      .filter((t) => t.client === mentee.name && t.type === 'Receita')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, mentee])

  if (isInitialLoad) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="md:col-span-2 h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-[300px] mt-6" />
      </div>
    )
  }

  if (!mentee) return null

  const progress = (mentee.sessions.length / mentee.totalSessions) * 100
  const now = new Date()
  const upcomingSessions = mentee.sessions
    .filter((s) => new Date(s.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totalPaid = menteeTransactions
    .filter((t) => t.status === 'Pago')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalPending = menteeTransactions
    .filter((t) => t.status === 'Pendente')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Progress Card */}
        <Card className="md:col-span-2 shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Meu Progresso</CardTitle>
            <CardDescription>Resumo das sessões de mentoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-primary">{mentee.sessions.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Sessões Concluídas</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground/80">{mentee.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Total Contratado</p>
                </div>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="shadow-sm border-border/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Em Aberto</span>
              <span className="font-bold text-destructive">{formatCurrency(totalPending)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Pago</span>
              <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financeiro" className="w-full mt-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 max-w-[400px]">
          <TabsTrigger value="financeiro">Meus Pagamentos</TabsTrigger>
          <TabsTrigger value="materiais">Sessões e Materiais</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="mt-4">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-base">Histórico de Faturas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {menteeTransactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum registro financeiro encontrado.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {menteeTransactions.map((tx) => {
                    const isOverdue =
                      tx.status === 'Pendente' && new Date(tx.date).getTime() < now.getTime()

                    const hasAttachment = tx.attachments && tx.attachments.length > 0

                    return (
                      <div
                        key={tx.id}
                        className={cn(
                          'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-muted/20',
                          isOverdue && 'bg-destructive/5 hover:bg-destructive/10',
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{tx.description}</h4>
                            <Badge
                              variant={tx.status === 'Pago' ? 'secondary' : 'outline'}
                              className={cn(
                                'text-[10px] px-2',
                                isOverdue && 'border-destructive text-destructive',
                                tx.status === 'Pago' &&
                                  'bg-green-100 text-green-800 hover:bg-green-100',
                              )}
                            >
                              {tx.status === 'Pago' ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center">
                            Vencimento:{' '}
                            {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-[300px]">
                          <span className="font-bold text-foreground">
                            {formatCurrency(tx.amount)}
                          </span>

                          <div className="flex gap-2">
                            {tx.status === 'Pendente' && tx.paymentLink && (
                              <Button
                                size="sm"
                                asChild
                                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                              >
                                <a href={tx.paymentLink} target="_blank" rel="noreferrer">
                                  Pagar <ExternalLink className="w-3 h-3 ml-1.5" />
                                </a>
                              </Button>
                            )}

                            {hasAttachment && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-2"
                                asChild
                              >
                                <a href={tx.attachments![0].url} download={tx.attachments![0].name}>
                                  <Download className="w-3.5 h-3.5 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Baixar PDF</span>
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materiais" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-base flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" /> Documentos Compartilhados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {!mentee.attachments || mentee.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum material compartilhado ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mentee.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/30 transition-colors"
                      >
                        <span className="text-sm font-medium truncate pr-4">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                          <a href={file.url} download={file.name}>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-base flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-primary" /> Próximas Sessões
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-6 flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Você não possui sessões futuras agendadas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 bg-primary/5 border border-primary/10 rounded-lg"
                      >
                        <div className="flex items-center mb-1">
                          <Clock className="w-4 h-4 text-primary mr-2" />
                          <span className="font-semibold text-sm">
                            {new Date(s.date).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        {s.discussion && (
                          <p className="text-xs text-muted-foreground mt-2 pl-6 border-l-2 border-primary/20">
                            {s.discussion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
