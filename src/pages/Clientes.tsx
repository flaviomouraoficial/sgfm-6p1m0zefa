import { useState } from 'react'
import { Client, Session } from '@/lib/types'
import { filterByDateRange } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useMainStore } from '@/stores/main'
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
import { Plus, BookOpen, Trash2, Edit, MoreVertical, RefreshCw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export default function Clientes() {
  const { toast } = useToast()
  const {
    clients,
    clientSessions,
    addClient,
    updateClient,
    removeClient,
    addClientSession,
    updateClientSession,
    removeClientSession,
    isSyncing,
  } = useMainStore()

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    status: 'active' as const,
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [sessionFilter, setSessionFilter] = useState('all')

  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [sessionFormData, setSessionFormData] = useState<Partial<Session>>({
    date: new Date().toISOString(),
    notes: '',
    status: 'Pendente',
  })

  const openNewClient = () => {
    setEditingClient(null)
    setFormData({ name: '', email: '', phone: '', status: 'active' })
    setClientDialogOpen(true)
  }

  const openEditClient = (client: Client) => {
    setEditingClient(client)
    setFormData(client)
    setClientDialogOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData)
        toast({ title: 'Sucesso', description: 'Dados do cliente atualizados.' })
      } else {
        await addClient(formData)
        toast({ title: 'Sucesso', description: 'Novo cliente adicionado.' })
      }
      setClientDialogOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar cliente.', variant: 'destructive' })
    }
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return
    try {
      await removeClient(clientToDelete.id)
      const toDelete = clientSessions.filter((s) => s.clientId === clientToDelete.id)
      for (const s of toDelete) {
        await removeClientSession(s.id)
      }
      toast({ title: 'Excluído', description: 'Cliente e prontuários removidos.' })
      setClientToDelete(null)
      if (selectedClient?.id === clientToDelete.id) {
        setSelectedClient(null)
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover cliente.', variant: 'destructive' })
    }
  }

  const openProntuario = (client: Client) => {
    setSelectedClient(client)
  }

  const openNewSession = () => {
    setEditingSession(null)
    setSessionFormData({
      date: new Date().toISOString().slice(0, 16),
      notes: '',
      status: 'Pendente',
    })
    setSessionDialogOpen(true)
  }

  const openEditSession = (s: Session) => {
    setEditingSession(s)
    setSessionFormData({
      date: new Date(s.date).toISOString().slice(0, 16),
      notes: s.notes,
      status: s.status || 'Pendente',
    })
    setSessionDialogOpen(true)
  }

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return
    try {
      if (editingSession) {
        await updateClientSession(editingSession.id, sessionFormData)
        toast({ title: 'Sucesso', description: 'Anotação atualizada.' })
      } else {
        await addClientSession({
          ...sessionFormData,
          clientId: selectedClient.id,
        })
        toast({ title: 'Sucesso', description: 'Sessão registrada.' })
      }
      setSessionDialogOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar sessão.', variant: 'destructive' })
    }
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return
    try {
      await removeClientSession(sessionToDelete.id)
      toast({ title: 'Excluída', description: 'Sessão removida do prontuário.' })
      setSessionToDelete(null)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao excluir sessão.', variant: 'destructive' })
    }
  }

  const currentClientSessions = selectedClient
    ? clientSessions
        .filter((s) => s.clientId === selectedClient.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : []
  const filteredSessions = filterByDateRange(currentClientSessions, sessionFilter)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Cadastro unificado de clientes e registro de sessões/prontuários.
          </p>
        </div>
        <Button onClick={openNewClient} className="bg-primary hover:bg-secondary">
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nome do Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <p>Nenhum cliente cadastrado ainda.</p>
                      <Button variant="link" onClick={openNewClient} className="h-auto p-0">
                        Adicionar Novo Cliente
                      </Button>
                    </div>
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
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openProntuario(client)}>
                        <BookOpen className="h-4 w-4 mr-1" /> Prontuário
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
                            <Edit className="w-4 h-4 mr-2" /> Editar Cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setClientToDelete(client)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir Cliente
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

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
            <Input
              placeholder="Nome Completo"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              placeholder="Telefone / WhatsApp"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Select
              value={formData.status}
              onValueChange={(v: 'active' | 'inactive') => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setClientDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSyncing}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.name}</strong>? Todo
              o histórico de sessões e prontuários será apagado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              disabled={isSyncing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-6 border-b bg-muted/10">
            <SheetTitle className="text-xl">Prontuário: {selectedClient?.name}</SheetTitle>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${selectedClient?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {selectedClient?.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentClientSessions.length} sessões
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
              <Plus className="w-4 h-4 mr-2" /> Nova Sessão
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma sessão registrada neste período.
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
                    <div className="text-xs font-semibold text-primary mb-2 flex justify-between items-center pr-16">
                      <span>
                        {new Date(s.date).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(s.date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Badge
                        variant={
                          s.status === 'Realizada'
                            ? 'default'
                            : s.status === 'Cancelada'
                              ? 'destructive'
                              : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {s.status || 'Pendente'}
                      </Badge>
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded border border-border/50">
                      {s.notes}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Editar Sessão' : 'Registrar Sessão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSession} className="space-y-4 pt-4">
            <Input
              type="datetime-local"
              value={sessionFormData.date as string}
              onChange={(e) => setSessionFormData({ ...sessionFormData, date: e.target.value })}
              required
            />
            <Select
              value={sessionFormData.status || 'Pendente'}
              onValueChange={(v) => setSessionFormData({ ...sessionFormData, status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Realizada">Realizada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sessionFormData.notes || ''}
              onChange={(e) => setSessionFormData({ ...sessionFormData, notes: e.target.value })}
              placeholder="Descreva a sessão, evolução ou próximos passos..."
              required
            />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setSessionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSyncing}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Sessão
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!sessionToDelete}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão do prontuário? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              disabled={isSyncing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
