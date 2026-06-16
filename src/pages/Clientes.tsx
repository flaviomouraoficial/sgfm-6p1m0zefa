import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Session } from '@/lib/types'
import { cn, filterByDateRange } from '@/lib/utils'
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  Building2,
  User,
  Check,
  ChevronsUpDown,
  Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, parseISO, isValid } from 'date-fns'

type PessoaCategoria = { id: string; nome: string }

type UnifiedClient = {
  id: string
  type: 'client' | 'mentee'
  name: string
  email: string
  phone: string
  status: string
  cnpj?: string
  cliente_id?: string
  cliente_nome?: string
  categoria_id?: string
  categoria_nome?: string
  originalData: any
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
  const [categorias, setCategorias] = useState<PessoaCategoria[]>([])
  const [rawClients, setRawClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') || ''
  const categoryFilter = searchParams.get('cat') || 'all'
  const statusFilter = searchParams.get('status') || 'all'

  const setSearchTerm = (v: string) => {
    setSearchParams(
      (prev) => {
        if (v) prev.set('q', v)
        else prev.delete('q')
        return prev
      },
      { replace: true },
    )
  }
  const setCategoryFilter = (v: string) => {
    setSearchParams(
      (prev) => {
        if (v !== 'all') prev.set('cat', v)
        else prev.delete('cat')
        return prev
      },
      { replace: true },
    )
  }
  const setStatusFilter = (v: string) => {
    setSearchParams(
      (prev) => {
        if (v !== 'all') prev.set('status', v)
        else prev.delete('status')
        return prev
      },
      { replace: true },
    )
  }

  const loadData = async () => {
    try {
      const [clientsRes, menteesRes, sessionsRes, catRes] = await Promise.all([
        pb.collection('v1_clientes').getFullList({ sort: 'name' }),
        pb
          .collection('v1_mentees')
          .getFullList({ expand: 'cliente_id,categoria_id', sort: 'name' }),
        pb.collection('v1_sessoes').getFullList<Session>({ sort: '-date' }),
        pb.collection('v1_pessoa_categorias').getFullList<PessoaCategoria>({ sort: 'nome' }),
      ])

      const unified: UnifiedClient[] = [
        ...clientsRes.map((c) => ({
          id: c.id,
          type: 'client' as const,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          status: c.status || 'Ativo',
          cnpj: c.cnpj || '',
          originalData: c,
        })),
        ...menteesRes.map((m) => ({
          id: m.id,
          type: 'mentee' as const,
          name: m.name,
          email: m.email || '',
          phone: m.phone || '',
          status: m.status || 'Ativo',
          cliente_id: m.cliente_id,
          cliente_nome: m.expand?.cliente_id?.name || '',
          categoria_id: m.categoria_id,
          categoria_nome: m.expand?.categoria_id?.nome || 'Pessoa Física',
          originalData: m,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name))

      setClients(unified)
      setSessions(sessionsRes)
      setRawClients(clientsRes)
      setCategorias(catRes)
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
  useRealtime('v1_pessoa_categorias', () => loadData())

  // Client Management State
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<UnifiedClient | null>(null)
  const [clientToDelete, setClientToDelete] = useState<UnifiedClient | null>(null)

  const [clientFormData, setClientFormData] = useState({
    type: 'client' as 'client' | 'mentee',
    name: '',
    email: '',
    phone: '',
    status: 'Ativo',
    cnpj: '',
    cliente_id: 'none',
    categoria_id: 'none',
  })
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [savingClient, setSavingClient] = useState(false)

  // Linked Person State
  const [linkedPersonDialogOpen, setLinkedPersonDialogOpen] = useState(false)
  const [linkedPersonFormData, setLinkedPersonFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    categoria_id: 'none',
    status: 'Ativo',
  })
  const [savingLinkedPerson, setSavingLinkedPerson] = useState(false)

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
    setClientFormData({
      type: 'client',
      name: '',
      email: '',
      phone: '',
      status: 'Ativo',
      cnpj: '',
      cliente_id: 'none',
      categoria_id: 'none',
    })
    setClientErrors({})
    setClientDialogOpen(true)
  }

  const openEditClient = (client: UnifiedClient) => {
    setEditingClient(client)
    setClientFormData({
      type: client.type,
      name: client.name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      cnpj: client.cnpj || '',
      cliente_id: client.cliente_id || 'none',
      categoria_id: client.categoria_id || 'none',
    })
    setClientErrors({})
    setClientDialogOpen(true)
  }

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientErrors({})
    setSavingClient(true)

    try {
      if (clientFormData.type === 'client') {
        const dataToSave = {
          name: clientFormData.name,
          email: clientFormData.email,
          phone: clientFormData.phone,
          status: clientFormData.status,
          cnpj: clientFormData.cnpj,
        }
        if (editingClient && editingClient.type === 'client') {
          await pb.collection('v1_clientes').update(editingClient.id, dataToSave)
        } else {
          await pb.collection('v1_clientes').create(dataToSave)
        }
      } else {
        const dataToSave = {
          name: clientFormData.name,
          email: clientFormData.email,
          phone: clientFormData.phone,
          status: clientFormData.status,
          cliente_id: clientFormData.cliente_id !== 'none' ? clientFormData.cliente_id : null,
          categoria_id: clientFormData.categoria_id !== 'none' ? clientFormData.categoria_id : null,
        }
        if (editingClient && editingClient.type === 'mentee') {
          await pb.collection('v1_mentees').update(editingClient.id, dataToSave)
        } else {
          await pb.collection('v1_mentees').create(dataToSave)
        }
      }
      toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' })
      setClientDialogOpen(false)
      loadData()
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
      if (editingClient?.id === clientToDelete.id) setClientDialogOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover registro.', variant: 'destructive' })
    } finally {
      setSavingClient(false)
    }
  }

  // Handlers for Linked Person
  const openNewLinkedPerson = () => {
    setLinkedPersonFormData({
      id: '',
      name: '',
      email: '',
      phone: '',
      categoria_id: 'none',
      status: 'Ativo',
    })
    setLinkedPersonDialogOpen(true)
  }

  const openEditLinkedPerson = (person: UnifiedClient) => {
    setLinkedPersonFormData({
      id: person.id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      categoria_id: person.categoria_id || 'none',
      status: person.status,
    })
    setLinkedPersonDialogOpen(true)
  }

  const handleSaveLinkedPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingLinkedPerson(true)
    try {
      const dataToSave = {
        name: linkedPersonFormData.name,
        email: linkedPersonFormData.email,
        phone: linkedPersonFormData.phone,
        status: linkedPersonFormData.status,
        categoria_id:
          linkedPersonFormData.categoria_id !== 'none' ? linkedPersonFormData.categoria_id : null,
        cliente_id: editingClient?.id,
      }
      if (linkedPersonFormData.id) {
        await pb.collection('v1_mentees').update(linkedPersonFormData.id, dataToSave)
      } else {
        await pb.collection('v1_mentees').create(dataToSave)
      }
      toast({ title: 'Sucesso', description: 'Pessoa vinculada salva com sucesso.' })
      setLinkedPersonDialogOpen(false)
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: 'Verifique os dados.', variant: 'destructive' })
    } finally {
      setSavingLinkedPerson(false)
    }
  }

  // Handlers for Sessions
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
      } else {
        await pb.collection('v1_sessoes').create(dataToSave)
      }
      toast({ title: 'Sucesso', description: 'Registro adicionado com sucesso.' })
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

  const filteredClients = clients.filter((c) => {
    const matchName =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'client'
          ? c.type === 'client'
          : c.type === 'mentee' && c.categoria_id === categoryFilter
    const matchStatus =
      statusFilter === 'all' ? true : c.status?.toLowerCase() === statusFilter.toLowerCase()
    return matchName && matchCategory && matchStatus
  })

  const linkedMentees =
    editingClient?.type === 'client'
      ? clients.filter((c) => c.type === 'mentee' && c.cliente_id === editingClient.id)
      : []

  const renderClientForm = () => (
    <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
      {!editingClient && (
        <div className="space-y-2">
          <Label>Tipo de Registro</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={clientFormData.type === 'client' ? 'default' : 'outline'}
              onClick={() => setClientFormData((p) => ({ ...p, type: 'client' }))}
              className="flex gap-2"
            >
              <Building2 className="w-4 h-4" /> Empresa (B2B)
            </Button>
            <Button
              type="button"
              variant={clientFormData.type === 'mentee' ? 'default' : 'outline'}
              onClick={() => setClientFormData((p) => ({ ...p, type: 'mentee' }))}
              className="flex gap-2"
            >
              <User className="w-4 h-4" /> Pessoa / Contato
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>
          Nome <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder={
            clientFormData.type === 'client' ? 'Razão Social ou Nome Fantasia' : 'Nome Completo'
          }
          value={clientFormData.name}
          onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
          required
          className={cn(clientErrors.name && 'border-red-500 focus-visible:ring-red-500')}
        />
        {clientErrors.name && <p className="text-sm text-red-500">{clientErrors.name}</p>}
      </div>

      {clientFormData.type === 'client' && (
        <div className="space-y-2">
          <Label>CNPJ</Label>
          <Input
            placeholder="00.000.000/0000-00"
            value={clientFormData.cnpj}
            onChange={(e) => setClientFormData({ ...clientFormData, cnpj: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            placeholder="E-mail"
            value={clientFormData.email}
            onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
            className={cn(clientErrors.email && 'border-red-500 focus-visible:ring-red-500')}
          />
          {clientErrors.email && <p className="text-sm text-red-500">{clientErrors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            placeholder="Telefone / WhatsApp"
            value={clientFormData.phone}
            onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
            className={cn(clientErrors.phone && 'border-red-500 focus-visible:ring-red-500')}
          />
          {clientErrors.phone && <p className="text-sm text-red-500">{clientErrors.phone}</p>}
        </div>
      </div>

      {clientFormData.type === 'mentee' && (
        <>
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-muted-foreground flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4" /> Vínculo Empresarial (Opcional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    'w-full justify-between font-normal',
                    !clientFormData.cliente_id || clientFormData.cliente_id === 'none'
                      ? 'text-muted-foreground'
                      : '',
                  )}
                >
                  {clientFormData.cliente_id && clientFormData.cliente_id !== 'none'
                    ? rawClients.find((c) => c.id === clientFormData.cliente_id)?.name
                    : 'Selecione a Empresa'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar empresa..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setClientFormData({ ...clientFormData, cliente_id: 'none' })
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            clientFormData.cliente_id === 'none' ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        Nenhuma
                      </CommandItem>
                      {rawClients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setClientFormData({ ...clientFormData, cliente_id: c.id })
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              clientFormData.cliente_id === c.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Categoria da Pessoa</Label>
            <Select
              value={clientFormData.categoria_id}
              onValueChange={(v) => setClientFormData({ ...clientFormData, categoria_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não Definida</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={clientFormData.status}
          onValueChange={(v) => setClientFormData({ ...clientFormData, status: v })}
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
  )

  const renderLinkedPeople = () => (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-dashed">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Pessoas da Empresa
          </h3>
          <p className="text-xs text-muted-foreground">Gerencie contatos, sócios ou sucessores.</p>
        </div>
        <Button size="sm" onClick={openNewLinkedPerson}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Pessoa
        </Button>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedMentees.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-sm">{m.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {m.categoria_nome}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditLinkedPerson(m)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setClientToDelete(m)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {linkedMentees.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  Nenhuma pessoa vinculada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-accent tracking-tight">Clientes e Pessoas</h1>
          <p className="text-muted-foreground mt-1">
            Gestão unificada de empresas (B2B) e contatos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="bg-white shadow-sm">
            <BookOpen className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button onClick={openNewClient} className="bg-primary hover:bg-secondary">
            <Plus className="mr-2 h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-border/60 print:border-none print:shadow-none">
        <div className="p-4 border-b bg-muted/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="client">Empresas (B2B)</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vínculo B2B</TableHead>
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
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-base flex items-center gap-2">
                      {client.type === 'client' ? (
                        <Building2 className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-blue-500" />
                      )}
                      {client.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{client.email || '-'}</div>
                      <div className="text-xs text-muted-foreground">{client.phone || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.type === 'client'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-blue-50 text-blue-700'
                        }
                      >
                        {client.type === 'client' ? 'Empresa / Cliente B2B' : client.categoria_nome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.type === 'mentee' && client.cliente_nome ? (
                        <span className="text-sm flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3 h-3" /> {client.cliente_nome}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2 print:hidden">
                      <Button variant="outline" size="sm" onClick={() => setSelectedClient(client)}>
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
                            <Edit className="w-4 h-4 mr-2" /> Editar Registro
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

      {/* Sheet para Histórico/Prontuário */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-6 border-b bg-muted/10">
            <SheetTitle className="text-xl">Prontuário: {selectedClient?.name}</SheetTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                {selectedClient?.type === 'client' ? 'Empresa B2B' : selectedClient?.categoria_nome}
              </Badge>
              {selectedClient?.cliente_nome && (
                <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded border">
                  Vínculo: {selectedClient.cliente_nome}
                </span>
              )}
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
              <Plus className="w-4 h-4 mr-2" />
              Nova Sessão
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
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {s.duration || 60} min
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {s.status || 'Pendente'}
                      </Badge>
                    </div>

                    {s.projeto && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                          <Briefcase className="w-3 h-3" /> Projeto / Tópico
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
                          <FileText className="w-3 h-3" /> Tarefas / Próximos Passos
                        </p>
                        <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground leading-relaxed">
                          {s.tasks}
                        </p>
                      </div>
                    )}
                    {s.notes && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                          <FileText className="w-3 h-3" /> Observações Internas
                        </p>
                        <p className="text-sm bg-muted/20 p-2.5 rounded border border-border/50 text-foreground whitespace-pre-wrap leading-relaxed">
                          {s.notes}
                        </p>
                      </div>
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
          </DialogHeader>

          {editingClient?.type === 'client' ? (
            <Tabs defaultValue="details" className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes da Empresa</TabsTrigger>
                <TabsTrigger value="people">Pessoas Vinculadas</TabsTrigger>
              </TabsList>
              <TabsContent value="details">{renderClientForm()}</TabsContent>
              <TabsContent value="people">{renderLinkedPeople()}</TabsContent>
            </Tabs>
          ) : (
            renderClientForm()
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar/Editar Pessoa Vinculada */}
      <Dialog open={linkedPersonDialogOpen} onOpenChange={setLinkedPersonDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {linkedPersonFormData.id ? 'Editar Pessoa' : 'Nova Pessoa Vinculada'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLinkedPerson} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                value={linkedPersonFormData.name}
                onChange={(e) =>
                  setLinkedPersonFormData({ ...linkedPersonFormData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={linkedPersonFormData.email}
                  onChange={(e) =>
                    setLinkedPersonFormData({ ...linkedPersonFormData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={linkedPersonFormData.phone}
                  onChange={(e) =>
                    setLinkedPersonFormData({ ...linkedPersonFormData, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria da Pessoa</Label>
              <Select
                value={linkedPersonFormData.categoria_id}
                onValueChange={(v) =>
                  setLinkedPersonFormData({ ...linkedPersonFormData, categoria_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não Definida</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkedPersonDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingLinkedPerson}>
                {savingLinkedPerson && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar/Editar Prontuário / Sessão */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registro de Sessão</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSession} className="space-y-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Data <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={sessionFormData.date}
                  onChange={(e) => setSessionFormData((p) => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Projeto / Tópico</Label>
                <Input
                  placeholder="Ex: Consultoria XYZ"
                  value={sessionFormData.projeto}
                  onChange={(e) => setSessionFormData((p) => ({ ...p, projeto: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Interação</Label>
                <Input
                  placeholder="Ex: Sessão, Reunião, Alinhamento"
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
                      setSessionFormData((p) => ({ ...p, duration: parseInt(e.target.value) || 0 }))
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
                onChange={(e) => setSessionFormData((p) => ({ ...p, discussion: e.target.value }))}
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
              <Label>Observações Gerais / Internas</Label>
              <Textarea
                rows={2}
                placeholder="Notas internas ou observações adicionais..."
                value={sessionFormData.notes}
                onChange={(e) => setSessionFormData((p) => ({ ...p, notes: e.target.value }))}
                className="resize-none"
              />
            </div>

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
                Salvar Registro
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
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
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
            <AlertDialogTitle>Excluir Sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro permanentemente?
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
