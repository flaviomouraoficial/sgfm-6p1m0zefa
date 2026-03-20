import { useState, useEffect, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, User, Building2, Phone, Mail, Clock, MessageSquare, Search } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Client } from '@/lib/types'

export default function Clientes() {
  const { clients, addClient, addClientInteraction, transactions, isInitialLoad } = useMainStore()

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newInteraction, setNewInteraction] = useState('')
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    status: 'Ativo',
    companyName: '',
  })
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (selectedClient) {
      setSelectedClient(clients.find((c) => c.id === selectedClient.id) || null)
    }
  }, [clients, selectedClient?.id])

  const filteredClients = useMemo(() => {
    if (!search) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()),
    )
  }, [clients, search])

  const handleSaveInteraction = () => {
    if (!newInteraction.trim() || !selectedClient) return
    addClientInteraction(selectedClient.id, {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      note: newInteraction,
    })
    setNewInteraction('')
  }

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (newClient.name) {
      addClient({
        ...newClient,
        id: Math.random().toString(36).substr(2, 9),
        isB2B: !!newClient.companyName,
        interactions: [],
      } as Client)
      setIsAddingClient(false)
      setNewClient({ name: '', email: '', phone: '', status: 'Ativo', companyName: '' })
    }
  }

  const getFinancialHistory = (clientName: string) => {
    return transactions
      .filter((t) => t.client === clientName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  if (isInitialLoad) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Contatos (CRM)</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus clientes e mentorados.</p>
        </div>
        <Button
          onClick={() => setIsAddingClient(true)}
          className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Contato
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm h-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedClient(client)}
                  >
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {client.companyName ? (
                          <Building2 className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {client.companyName || '-'}
                    </TableCell>
                    <TableCell className="text-xs">{client.email}</TableCell>
                    <TableCell className="text-xs">{client.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={client.status === 'Inativo' ? 'secondary' : 'default'}
                        className={cn(
                          client.status === 'Ativo' &&
                            'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
                        )}
                      >
                        {client.status || 'Ativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedClient} onOpenChange={(o) => !o && setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-xl md:w-[600px] p-0 flex flex-col border-l">
          {selectedClient && (
            <>
              <SheetHeader className="p-6 border-b bg-muted/10">
                <SheetTitle className="text-2xl flex items-center">
                  {selectedClient.name}
                </SheetTitle>
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  {selectedClient.companyName && (
                    <span className="flex items-center text-muted-foreground font-medium">
                      <Building2 className="w-4 h-4 mr-1.5" /> {selectedClient.companyName}
                    </span>
                  )}
                  {selectedClient.email && (
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="flex items-center text-primary hover:underline"
                    >
                      <Mail className="w-4 h-4 mr-1.5" /> {selectedClient.email}
                    </a>
                  )}
                  {selectedClient.phone && (
                    <a
                      href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-green-600 hover:underline"
                    >
                      <Phone className="w-4 h-4 mr-1.5" /> {selectedClient.phone}
                    </a>
                  )}
                </div>
              </SheetHeader>

              <Tabs defaultValue="geral" className="flex-1 flex flex-col">
                <div className="px-6 pt-2 border-b">
                  <TabsList className="bg-transparent space-x-2">
                    <TabsTrigger
                      value="geral"
                      className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4"
                    >
                      Informações
                    </TabsTrigger>
                    <TabsTrigger
                      value="comunicacao"
                      className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4"
                    >
                      E-mails Enviados
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <TabsContent value="geral" className="p-6 space-y-8 m-0 outline-none">
                    {/* Financial History */}
                    <div>
                      <h3 className="text-sm font-bold flex items-center text-foreground/90 mb-4 pb-2 border-b border-border/50">
                        <Clock className="w-4 h-4 mr-2 text-primary" /> Histórico Financeiro
                      </h3>
                      {getFinancialHistory(selectedClient.name).length === 0 ? (
                        <p className="text-xs text-muted-foreground p-4 bg-muted/20 rounded-lg text-center border border-dashed">
                          Nenhum registro financeiro encontrado.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {getFinancialHistory(selectedClient.name).map((tx) => (
                            <div
                              key={tx.id}
                              className="p-3 bg-card border rounded-lg flex items-center justify-between shadow-sm hover:shadow transition-shadow"
                            >
                              <div>
                                <p className="text-sm font-semibold">{tx.description}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(tx.date).toLocaleDateString('pt-BR')} •{' '}
                                  {tx.service || tx.category}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={cn(
                                    'font-bold',
                                    tx.type === 'Receita' ? 'text-green-600' : 'text-red-600',
                                  )}
                                >
                                  {tx.type === 'Receita' ? '+' : '-'} {formatCurrency(tx.amount)}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'mt-1 text-[10px]',
                                    tx.status === 'Pago'
                                      ? 'border-green-200 text-green-700 bg-green-50'
                                      : 'border-yellow-200 text-yellow-700 bg-yellow-50',
                                  )}
                                >
                                  {tx.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interaction Log */}
                    <div>
                      <h3 className="text-sm font-bold flex items-center text-foreground/90 mb-4 pb-2 border-b border-border/50">
                        <MessageSquare className="w-4 h-4 mr-2 text-primary" /> Registro de
                        Interações
                      </h3>

                      <div className="space-y-3 mb-6">
                        <Textarea
                          placeholder="Adicione uma nota sobre a conversa ou progresso..."
                          className="text-sm min-h-[80px] resize-none"
                          value={newInteraction}
                          onChange={(e) => setNewInteraction(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleSaveInteraction}
                            disabled={!newInteraction.trim()}
                          >
                            Salvar Nota
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {!selectedClient.interactions ||
                        selectedClient.interactions.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center italic">
                            Nenhuma interação registrada ainda.
                          </p>
                        ) : (
                          [...selectedClient.interactions].reverse().map((interaction) => (
                            <div
                              key={interaction.id}
                              className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm"
                            >
                              <div className="text-[10px] text-muted-foreground font-medium mb-1.5 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(interaction.date).toLocaleString('pt-BR')}
                              </div>
                              <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                {interaction.note}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="comunicacao" className="p-6 m-0 outline-none">
                    <h3 className="text-sm font-semibold flex items-center text-foreground/90 mb-4">
                      <Mail className="w-4 h-4 mr-2 text-primary" /> Automações de Cobrança
                    </h3>

                    {!selectedClient.emailLogs || selectedClient.emailLogs.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                        Nenhuma comunicação por e-mail registrada.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedClient.emailLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-card border rounded-lg shadow-sm flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold leading-none mb-1">
                                {log.subject}
                              </p>
                              <div className="flex items-center text-xs text-muted-foreground gap-2">
                                <span>{new Date(log.date).toLocaleString('pt-BR')}</span>
                                <span>•</span>
                                <span className="font-medium text-foreground/70">{log.type}</span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                log.status === 'Enviado'
                                  ? 'border-green-200 text-green-700 bg-green-50'
                                  : 'border-red-200 text-red-700 bg-red-50',
                              )}
                            >
                              {log.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                required
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa (Opcional)</Label>
              <Input
                value={newClient.companyName}
                onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newClient.status}
                onValueChange={(v: any) => setNewClient({ ...newClient, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddingClient(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Contato</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
