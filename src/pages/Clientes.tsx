import { useEffect, useState } from 'react'
import { cloudApi } from '@/lib/cloudApi'
import { Client, Session } from '@/lib/types'
import { filterByDateRange } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, BookOpen, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Clientes() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as const,
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionFilter, setSessionFilter] = useState('all')
  const [newNote, setNewNote] = useState('')

  const loadClients = async () => {
    const data = await cloudApi.clients.list()
    setClients(data)
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    await cloudApi.clients.create(formData)
    toast({ title: 'Sucesso', description: 'Mentorado adicionado.' })
    setIsDialogOpen(false)
    loadClients()
  }

  const handleDeleteClient = async (id: string) => {
    await cloudApi.clients.delete(id)
    toast({ title: 'Excluído', description: 'Mentorado removido.' })
    loadClients()
  }

  const openProntuario = async (client: Client) => {
    setSelectedClient(client)
    const data = await cloudApi.sessions.list()
    setSessions(data.filter((s) => s.clientId === client.id))
  }

  const handleAddSession = async () => {
    if (!selectedClient || !newNote.trim()) return
    const session = await cloudApi.sessions.create({
      clientId: selectedClient.id,
      date: new Date().toISOString(),
      notes: newNote,
    })
    setSessions([...sessions, session])
    setNewNote('')
    toast({ title: 'Salvo', description: 'Anotação registrada.' })
  }

  const filteredSessions = filterByDateRange(sessions, sessionFilter)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-accent">Gestão de Mentorados</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-secondary">
              <Plus className="mr-2 h-4 w-4" /> Novo Mentorado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Mentorado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <Input
                placeholder="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                placeholder="E-mail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                placeholder="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  {client.email}
                  <br />
                  <span className="text-xs text-muted-foreground">{client.phone}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openProntuario(client)}>
                    <BookOpen className="h-4 w-4 mr-1" /> Prontuário
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-primary">Prontuário: {selectedClient?.name}</SheetTitle>
          </SheetHeader>

          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o histórico</SelectItem>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>

          <ScrollArea className="flex-1 mt-4 rounded-md border p-4 bg-muted/20">
            {filteredSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma anotação encontrada.
              </p>
            ) : (
              filteredSessions.map((s) => (
                <div key={s.id} className="mb-4 p-3 bg-white border rounded-lg shadow-sm">
                  <div className="text-xs font-semibold text-secondary mb-1">
                    {new Date(s.date).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(s.date).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">{s.notes}</div>
                </div>
              ))
            )}
          </ScrollArea>

          <div className="mt-4 flex flex-col gap-2 pt-4 border-t">
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Descreva a sessão..."
            />
            <Button onClick={handleAddSession} className="bg-primary hover:bg-secondary">
              Registrar Sessão
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
