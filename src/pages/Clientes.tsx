import { useState, useEffect } from 'react'
import { Client, Mentee, Session } from '@/lib/types'
import { filterByDateRange } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  BookOpen,
  Trash2,
  Edit,
  MoreVertical,
  RefreshCw,
  Clock,
  Calendar,
  FileText,
  Briefcase,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format, parseISO, isValid } from 'date-fns'

type UnifiedClient = {
  id: string
  type: 'client' | 'mentee'
  name: string
  email: string
  phone: string
  status: string
  originalData: Client | Mentee
}

const formatDateSafe = (dateStr?: string | null) => {
  if (!dateStr) return 'N/A'
  try {
    const parsed = parseISO(dateStr)
    return isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : 'N/A'
  } catch {
    return 'N/A'
  }
}

export default function Clientes() {
  const { toast } = useToast()

  const [clients, setClients] = useState<UnifiedClient[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [clientsRes, menteesRes, sessionsRes] = await Promise.all([
        pb.collection('v1_clientes').getFullList<Client>({ sort: 'name' }),
        pb.collection('v1_mentees').getFullList<Mentee>({ sort: 'name' }),
        pb.collection('v1_sessoes').getFullList<Session>({ sort: '-date' }),
      ])

      const unified: UnifiedClient[] = [
        ...clientsRes.map((c) => ({
          id: c.id,
          type: 'client' as const,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          status: c.status || 'active',
          originalData: c,
        })),
        ...menteesRes.map((m) => ({
          id: m.id,
          type: 'mentee' as const,
          name: m.name,
          email: m.email || '',
          phone: m.phone || '',
          status: m.status || 'Ativo',
          originalData: m,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name))

      setClients(unified)
      setSessions(sessionsRes)
    } catch (err) {
      toast({
        title: 'Erro de conexão',
        description: 'Falha ao carregar dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('v1_clientes', () => loadData())
  useRealtime('v1_mentees', () => loadData())
  useRealtime('v1_sessoes', () => loadData())

  // Client Management State
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<UnifiedClient | null>(null)
  const [clientToDelete, setClientToDelete] = useState<UnifiedClient | null>(null)
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
  })
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [savingClient, setSavingClient] = useState(false)

  // Prontuário/Histórico State
  const [selectedClient, setSelectedClient] = useState<UnifiedClient | null>(null)
  const [sessionFilter, setSessionFilter] = useState('all')

  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [sessionFormData, setSessionFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    projeto: '',
    type: 'Sessão Individual',
    duration: 60,
    status: 'Concluída',
    notes: '',
    discussion: '',
    tasks: '',
  })
  const [sessionErrors, setSessionErrors] = useState<Record<string, string>>({})
  const [savingSession, setSavingSession] = useState(false)

  // Handlers for Clients
  const openNewClient = () => {
    setEditingClient(null)
    setClientFormData({ name: '', email: '', phone: '', status: 'active' })
    setClientErrors({})
    setClientDialogOpen(true)
  }

  const openEditClient = (client: UnifiedClient) => {
    setEditingClient(client)
    setClientFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      status: client.status,
    })
    setClientErrors({})
    setClientDialogOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientErrors({})
    setSavingClient(true)

    try {
      const dataToSave = { ...clientFormData }
      if (editingClient) {
        const collection = editingClient.type === 'client' ? 'v1_clientes' : 'v1_mentees'
        await pb.collection(collection).update(editingClient.id, dataToSave)
        toast({ title: 'Sucesso', description: 'Dados atualizados.' })
      } else {
        await pb.collection('v1_clientes').create(dataToSave)
        toast({ title: 'Sucesso', description: 'Novo cliente adicionado.' })
      }
      setClientDialogOpen(false)
    } catch (err) {
      setClientErrors(extractFieldErrors(err))
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingClient(false)
    }
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return
    setSavingClient(true)
    try {
      const collection = clientToDelete.type === 'client' ? 'v1_clientes' : 'v1_mentees'
      await pb.collection(collection).delete(clientToDelete.id)
      toast({ title: 'Excluído', description: 'Registro removido permanentemente.' })
      setClientToDelete(null)
      if (selectedClient?.id === clientToDelete.id) setSelectedClient(null)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover registro.', variant: 'destructive' })
    } finally {
      setSavingClient(false)
    }
  }

  // Handlers for Sessions (Prontuários / Históricos)
  const openNewSession = () => {
    setEditingSession(null)
    setSessionFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      projeto: '',
      type: 'Sessão Individual',
      duration: 60,
      status: 'Concluída',
      notes: '',
      discussion: '',
      tasks: '',
    })
    setSessionErrors({})
    setSessionDialogOpen(true)
  }

  const openEditSession = (s: Session) => {
    setEditingSession(s)
    setSessionFormData({
      date: s.date ? s.date.substring(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      projeto: s.projeto || '',
      type: s.type || 'Sessão Individual',
      duration: s.duration || 60,
      status: s.status || 'Concluída',
      notes: s.notes || '',
      discussion: s.discussion || '',
      tasks: s.tasks || '',
    })
    setSessionErrors({})
    setSessionDialogOpen(true)
  }

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return

    setSessionErrors({})
    setSavingSession(true)

    try {
      const dataToSave = {
        date: sessionFormData.date
          ? new Date(sessionFormData.date + 'T12:00:00Z').toISOString()
          : null,
        projeto: sessionFormData.projeto,
        type: sessionFormData.type,
        duration: Number(sessionFormData.duration) || 0,
        status: sessionFormData.status,
        notes: sessionFormData.notes,
        discussion: sessionFormData.discussion,
        tasks: sessionFormData.tasks,
        client_id: selectedClient.type === 'client' ? selectedClient.id : '',
        mentee_id: selectedClient.type === 'mentee' ? selectedClient.id : '',
      }

      if (editingSession) {
        await pb.collection('v1_sessoes').update(editingSession.id, dataToSave)
        toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' })
      } else {
        await pb.collection('v1_sessoes').create(dataToSave)
        toast({ title: 'Sucesso', description: 'Registro adicionado com sucesso.' })
      }
      setSessionDialogOpen(false)
    } catch (err: any) {
      setSessionErrors(extractFieldErrors(err))
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha ao salvar registro.',
        variant: 'destructive',
      })
    } finally {
      setSavingSession(false)
    }
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return
    try {
      await pb.collection('v1_sessoes').delete(sessionToDelete.id)
      toast({ title: 'Excluído', description: 'Registro removido com sucesso.' })
      setSessionToDelete(null)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao excluir registro.', variant: 'destructive' })
    }
  }

  const currentClientSessions = selectedClient
    ? sessions
        .filter((s) =>
          selectedClient.type === 'client'
            ? s.client_id === selectedClient.id
            : s.mentee_id === selectedClient.id,
        )
        .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
    : []

  const filteredSessions = filterByDateRange(currentClientSessions, sessionFilter)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-accent tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Cadastro unificado de clientes, mentorados e históricos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="bg-white shadow-sm">
            <BookOpen className="w-4 h-4 mr-2" /> Imprimir Relatório
          </Button>
          <Button onClick={openNewClient} className="bg-primary hover:bg-secondary">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-border/60 print:border-none print:shadow-none">
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right print:hidden">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-base">{client.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{client.email}</div>
                      <div className="text-xs text-muted-foreground">{client.phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.type === 'mentee' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50'
                        }
                      >
                        {client.type === 'mentee' ? 'Mentorado' : 'Cliente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${client.status.toLowerCase() === 'ativo' || client.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {client.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2 print:hidden">
                      <Button variant="outline" size="sm" onClick={() => setSelectedClient(client)}>
                        <BookOpen className="h-4 w-4 mr-1" />{' '}
                        {client.type === 'client' ? 'Histórico' : 'Prontuário'}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditClient(client)}>
                            <Edit className="w-4 h-4 mr-2" /> Editar Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setClientToDelete(client)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sheet para Histórico/Prontuário do Cliente */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-6 border-b bg-muted/10">
            <SheetTitle className="text-xl">
              {selectedClient?.type === 'client' ? 'Histórico' : 'Prontuário'}:{' '}
              {selectedClient?.name}
            </SheetTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                {selectedClient?.type === 'mentee' ? 'Mentorado' : 'Cliente'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentClientSessions.length} registros
              </span>
            </div>
          </SheetHeader>

          <div className="px-6 pt-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filtrar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o histórico</SelectItem>
                <SelectItem value="day">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openNewSession} size="sm" className="h-9 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {selectedClient?.type === 'client' ? 'Novo Histórico' : 'Novo Prontuário'}
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Nenhum registro encontrado neste período.
                  </p>
                </div>
              ) : (
                filteredSessions.map((s) => (
                  <div
                    key={s.id}
                    className="group p-4 bg-card border rounded-lg shadow-sm relative transition-colors hover:border-primary/30"
                  >
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => openEditSession(s)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setSessionToDelete(s)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="text-xs font-semibold text-primary mb-3 flex flex-wrap gap-2 justify-between items-center pr-16">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {formatDateSafe(s.date)}
                        </span>
                        {selectedClient?.type === 'mentee' && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {s.duration || 60} min
                          </span>
                        )}
                      </div>
                      {selectedClient?.type === 'mentee' && (
                        <Badge
                          variant={
                            s.status === 'Concluída'
                              ? 'default'
                              : s.status === 'Cancelada'
                                ? 'destructive'
                                : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {s.status || 'Pendente'}
                        </Badge>
                      )}
                    </div>

                    {selectedClient?.type === 'client' ? (
                      <>
                        {s.projeto && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                              <Briefcase className="w-3 h-3" /> Projeto
                            </p>
                            <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground leading-relaxed">
                              {s.projeto}
                            </p>
                          </div>
                        )}
                        {s.notes && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                              <FileText className="w-3 h-3" /> Observações
                            </p>
                            <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground whitespace-pre-wrap leading-relaxed">
                              {s.notes}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {s.projeto && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                              <Briefcase className="w-3 h-3" /> Projeto
                            </p>
                            <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground leading-relaxed">
                              {s.projeto}
                            </p>
                          </div>
                        )}
                        {s.discussion && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                              <FileText className="w-3 h-3" /> Discussão
                            </p>
                            <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground leading-relaxed">
                              {s.discussion}
                            </p>
                          </div>
                        )}
                        {s.tasks && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                              <FileText className="w-3 h-3" /> Tarefas
                            </p>
                            <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground leading-relaxed">
                              {s.tasks}
                            </p>
                          </div>
                        )}
                        {s.notes && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                              <FileText className="w-3 h-3" /> Observações
                            </p>
                            <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground whitespace-pre-wrap leading-relaxed">
                              {s.notes}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dialog: Criar/Editar Cliente */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Perfil' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Nome Completo"
                value={clientFormData.name}
                onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                className={clientErrors.name ? 'border-red-500' : ''}
              />
              {clientErrors.name && <p className="text-xs text-red-500">{clientErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="E-mail"
                value={clientFormData.email}
                onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                className={clientErrors.email ? 'border-red-500' : ''}
              />
              {clientErrors.email && <p className="text-xs text-red-500">{clientErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="Telefone / WhatsApp"
                value={clientFormData.phone}
                onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                className={clientErrors.phone ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={clientFormData.status}
                onValueChange={(v) => setClientFormData({ ...clientFormData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setClientDialogOpen(false)}
                disabled={savingClient}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingClient}>
                {savingClient ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar/Editar Prontuário / Histórico */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession
                ? selectedClient?.type === 'client'
                  ? 'Editar Histórico'
                  : 'Editar Prontuário'
                : selectedClient?.type === 'client'
                  ? 'Novo Histórico'
                  : 'Novo Prontuário'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSession} className="space-y-5 py-4">
            {selectedClient?.type === 'client' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Data <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={sessionFormData.date}
                      onChange={(e) => setSessionFormData((p) => ({ ...p, date: e.target.value }))}
                      className={sessionErrors.date ? 'border-red-500' : ''}
                    />
                    {sessionErrors.date && (
                      <p className="text-xs text-red-500">{sessionErrors.date}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Projeto</Label>
                    <Input
                      placeholder="Ex: Consultoria XYZ"
                      value={sessionFormData.projeto}
                      onChange={(e) =>
                        setSessionFormData((p) => ({ ...p, projeto: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Observações</Label>
                  <Textarea
                    rows={4}
                    placeholder="Detalhes e observações da interação..."
                    value={sessionFormData.notes}
                    onChange={(e) => setSessionFormData((p) => ({ ...p, notes: e.target.value }))}
                    className="resize-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Data <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={sessionFormData.date}
                      onChange={(e) => setSessionFormData((p) => ({ ...p, date: e.target.value }))}
                      className={sessionErrors.date ? 'border-red-500' : ''}
                    />
                    {sessionErrors.date && (
                      <p className="text-xs text-red-500">{sessionErrors.date}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Projeto</Label>
                    <Input
                      placeholder="Ex: Consultoria XYZ"
                      value={sessionFormData.projeto}
                      onChange={(e) =>
                        setSessionFormData((p) => ({ ...p, projeto: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Sessão</Label>
                    <Input
                      placeholder="Ex: Sessão Individual"
                      value={sessionFormData.type}
                      onChange={(e) => setSessionFormData((p) => ({ ...p, type: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Duração (min)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={sessionFormData.duration}
                        onChange={(e) =>
                          setSessionFormData((p) => ({
                            ...p,
                            duration: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={sessionFormData.status}
                        onValueChange={(val) => setSessionFormData((p) => ({ ...p, status: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Agendada">Agendada</SelectItem>
                          <SelectItem value="Concluída">Concluída</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Discussão (O que foi abordado?)</Label>
                  <Textarea
                    rows={3}
                    placeholder="Registre os pontos principais da conversa..."
                    value={sessionFormData.discussion}
                    onChange={(e) =>
                      setSessionFormData((p) => ({ ...p, discussion: e.target.value }))
                    }
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tarefas / Próximos Passos</Label>
                  <Textarea
                    rows={3}
                    placeholder="Liste as tarefas ou ações definidas..."
                    value={sessionFormData.tasks}
                    onChange={(e) => setSessionFormData((p) => ({ ...p, tasks: e.target.value }))}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações Gerais</Label>
                  <Textarea
                    rows={2}
                    placeholder="Notas internas ou observações adicionais..."
                    value={sessionFormData.notes}
                    onChange={(e) => setSessionFormData((p) => ({ ...p, notes: e.target.value }))}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSessionDialogOpen(false)}
                disabled={savingSession}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingSession}>
                {savingSession ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                {selectedClient?.type === 'client' ? 'Salvar Histórico' : 'Salvar Prontuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{clientToDelete?.name}</strong>? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              disabled={savingClient}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {savingClient ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!sessionToDelete}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta anotação permanentemente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
