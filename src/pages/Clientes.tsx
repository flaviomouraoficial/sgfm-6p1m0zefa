import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { exportToCSV, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Building2,
  User,
  Phone,
  Mail,
  Download,
  Printer,
  Clock,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react'

export default function Clientes() {
  const { clients, mentees, timeSlots, transactions } = useMainStore()
  const [selectedClient, setSelectedClient] = useState<any | null>(null)

  const clientSummaries = useMemo(() => {
    const nameMap = new Map<string, any>()

    timeSlots
      .filter((t) => t.isBooked && t.menteeName)
      .forEach((t) => {
        const key = t.menteeName!.toLowerCase().trim()
        if (!nameMap.has(key)) {
          nameMap.set(key, {
            name: t.menteeName,
            company: t.menteeCompany || '',
            email: t.menteeEmail || '',
            phone: '',
            timeSlots: [],
            menteeSessions: [],
            transactions: [],
          })
        }
        nameMap.get(key).timeSlots.push(t)
      })

    mentees.forEach((m) => {
      const key = m.name.toLowerCase().trim()
      if (!nameMap.has(key)) {
        nameMap.set(key, {
          name: m.name,
          company: m.company || '',
          email: m.email || '',
          phone: m.phone || '',
          timeSlots: [],
          menteeSessions: [],
          transactions: [],
        })
      }
      const entry = nameMap.get(key)
      entry.menteeSessions.push(...m.sessions)
      if (!entry.company && m.company) entry.company = m.company
      if (!entry.email && m.email) entry.email = m.email
      if (!entry.phone && m.phone) entry.phone = m.phone
    })

    transactions
      .filter((t) => t.type === 'Receita' && t.client)
      .forEach((t) => {
        const key = t.client!.toLowerCase().trim()
        if (!nameMap.has(key)) {
          nameMap.set(key, {
            name: t.client,
            company: '',
            email: '',
            phone: '',
            timeSlots: [],
            menteeSessions: [],
            transactions: [],
          })
        }
        nameMap.get(key).transactions.push(t)
      })

    clients.forEach((c) => {
      const key = c.name.toLowerCase().trim()
      if (!nameMap.has(key)) {
        nameMap.set(key, {
          name: c.name,
          company: c.companyName || '',
          email: c.email || '',
          phone: c.phone || '',
          timeSlots: [],
          menteeSessions: [],
          transactions: [],
        })
      }
      const entry = nameMap.get(key)
      if (!entry.company && c.companyName) entry.company = c.companyName
      if (!entry.email && c.email) entry.email = c.email
      if (!entry.phone && c.phone) entry.phone = c.phone
    })

    return Array.from(nameMap.values())
      .map((entry) => {
        const totalPaid = entry.transactions
          .filter((t: any) => t.status === 'Pago')
          .reduce((sum: number, t: any) => sum + t.amount, 0)
        const totalPending = entry.transactions
          .filter((t: any) => t.status === 'Pendente')
          .reduce((sum: number, t: any) => sum + t.amount, 0)
        return {
          ...entry,
          totalSessions: entry.timeSlots.length + entry.menteeSessions.length,
          totalPaid,
          totalPending,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [clients, mentees, timeSlots, transactions])

  const now = new Date()

  const timeline = useMemo(() => {
    if (!selectedClient) return []
    const events: any[] = []

    selectedClient.timeSlots.forEach((t: any) => {
      const date = new Date(`${t.date}T${t.time}:00`)
      events.push({ id: t.id, title: 'Agendamento de Mentoria', date, type: 'slot', data: t })
    })

    selectedClient.menteeSessions.forEach((s: any) => {
      const date = new Date(s.date)
      events.push({ id: s.id, title: 'Sessão Concluída', date, type: 'session', data: s })
    })

    return events.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [selectedClient])

  const past = timeline.filter((e) => e.date <= now)
  const upcoming = timeline.filter((e) => e.date > now)

  const handleExportSummary = () => {
    const exportData = clientSummaries.map((c) => ({
      Nome: c.name,
      Empresa: c.company,
      'E-mail': c.email,
      'Total Sessões': c.totalSessions,
      Recebido: c.totalPaid,
      Pendente: c.totalPending,
    }))
    exportToCSV('clientes_crm.csv', exportData)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Clientes</h1>
        <div className="flex items-center space-x-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSummary} className="h-9">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {clientSummaries.map((client, idx) => (
          <Card
            key={idx}
            className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
            onClick={() => setSelectedClient(client)}
          >
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  {client.company && client.company !== 'N/A' ? (
                    <Building2 className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <CardTitle className="text-base truncate">{client.name}</CardTitle>
                  {client.company && client.company !== 'N/A' && (
                    <p className="text-[10px] text-muted-foreground uppercase truncate mt-0.5">
                      {client.company}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between text-xs font-medium text-muted-foreground bg-muted/20 px-3 py-2 rounded">
                <span>Sessões de Mentoria</span>
                <span className="font-bold text-foreground">{client.totalSessions}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-green-50 text-green-700 p-2 rounded border border-green-100 flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase font-bold mb-0.5 opacity-80">
                    Recebido
                  </span>
                  <span className="font-bold text-sm">{formatCurrency(client.totalPaid)}</span>
                </div>
                <div className="bg-yellow-50 text-yellow-700 p-2 rounded border border-yellow-100 flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase font-bold mb-0.5 opacity-80">
                    Pendente
                  </span>
                  <span className="font-bold text-sm">{formatCurrency(client.totalPending)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {clientSummaries.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            Nenhum cliente ou mentorado encontrado.
          </div>
        )}
      </div>

      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-xl md:w-[500px] p-0 flex flex-col border-l">
          {selectedClient && (
            <>
              <SheetHeader className="p-6 border-b bg-muted/10">
                <SheetTitle className="text-xl">{selectedClient.name}</SheetTitle>
                {selectedClient.company && selectedClient.company !== 'N/A' && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <Building2 className="w-4 h-4 mr-2" />
                    {selectedClient.company}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  {selectedClient.email && (
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="flex items-center text-primary hover:underline"
                    >
                      <Mail className="w-4 h-4 mr-1" /> E-mail
                    </a>
                  )}
                  {selectedClient.phone && (
                    <a
                      href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-green-600 hover:underline"
                    >
                      <Phone className="w-4 h-4 mr-1" /> WhatsApp
                    </a>
                  )}
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="shadow-sm border-green-200 bg-green-50/50">
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <p className="text-[10px] uppercase font-bold text-green-800 mb-1">
                          Total Recebido
                        </p>
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(selectedClient.totalPaid)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-yellow-200 bg-yellow-50/50">
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <p className="text-[10px] uppercase font-bold text-yellow-800 mb-1">
                          Total Pendente
                        </p>
                        <p className="text-lg font-bold text-yellow-700">
                          {formatCurrency(selectedClient.totalPending)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold flex items-center text-foreground/90 mb-4 pb-2 border-b border-border/50">
                      <CalendarCheck className="w-4 h-4 mr-2 text-primary" /> Próximos Agendamentos
                    </h3>
                    {upcoming.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4 bg-muted/20 rounded-lg text-center border border-dashed">
                        Nenhum agendamento futuro.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {upcoming.map((e) => (
                          <div
                            key={e.id}
                            className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-3"
                          >
                            <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold">{e.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {e.date.toLocaleString('pt-BR', {
                                  dateStyle: 'long',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold flex items-center text-foreground/90 mb-4 pb-2 border-b border-border/50">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-muted-foreground" /> Histórico de
                      Sessões
                    </h3>
                    {past.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4 bg-muted/20 rounded-lg text-center border border-dashed">
                        Nenhum histórico encontrado.
                      </p>
                    ) : (
                      <div className="space-y-5 ml-2">
                        {past.map((e) => (
                          <div
                            key={e.id}
                            className="relative pl-6 pb-2 border-l-2 border-border/60 last:border-0 last:pb-0"
                          >
                            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-muted border-2 border-background rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-primary/50 rounded-full" />
                            </div>
                            <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm hover:shadow transition-shadow">
                              <p className="font-bold text-sm text-foreground/90 mb-1">{e.title}</p>
                              <p className="text-[11px] font-medium text-muted-foreground mb-2">
                                {e.date.toLocaleString('pt-BR', {
                                  dateStyle: 'long',
                                  timeStyle: 'short',
                                })}
                              </p>
                              {e.type === 'session' && e.data.discussion && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                    <span className="font-bold text-[10px] uppercase text-muted-foreground block mb-1">
                                      Discussão / Resumo:
                                    </span>
                                    {e.data.discussion}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
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
