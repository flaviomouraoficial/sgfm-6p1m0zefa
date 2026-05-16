import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Calendar, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Mentee, Client, Session } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Prontuarios() {
  const [sessoes, setSessoes] = useState<Session[]>([])
  const [options, setOptions] = useState<{ id: string; name: string; type: 'mentee' | 'client' }[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  const [toastMessage, setToastMessage] = useState<{ title: string; error?: boolean } | null>(null)

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const showToast = (title: string, error = false) => setToastMessage({ title, error })

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    personId: '',
    type: 'Sessão Individual',
    duration: 60,
    status: 'Concluída',
    notes: '',
    discussion: '',
    tasks: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      const [sessoesData, menteesData, clientesData] = await Promise.all([
        pb
          .collection('v1_sessoes')
          .getFullList<Session>({ expand: 'mentee_id,client_id', sort: '-date' }),
        pb.collection('v1_mentees').getFullList<Mentee>({ sort: 'name' }),
        pb.collection('v1_clientes').getFullList<Client>({ sort: 'name' }),
      ])

      const unifiedOptions = [
        ...menteesData.map((m) => ({
          id: m.id,
          name: m.name + ' (Mentorado)',
          type: 'mentee' as const,
        })),
        ...clientesData.map((c) => ({
          id: c.id,
          name: c.name + ' (Cliente)',
          type: 'client' as const,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name))

      setSessoes(sessoesData)
      setOptions(unifiedOptions)
    } catch (err) {
      showToast('Erro ao carregar dados', true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('v1_sessoes', () => loadData())
  useRealtime('v1_mentees', () => loadData())
  useRealtime('v1_clientes', () => loadData())

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      personId: '',
      type: 'Sessão Individual',
      duration: 60,
      status: 'Concluída',
      notes: '',
      discussion: '',
      tasks: '',
    })
    setErrors({})
    setEditingSession(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    setIsDialogOpen(open)
  }

  const handleEdit = (session: Session) => {
    setEditingSession(session)
    setFormData({
      date: session.date ? session.date.substring(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      personId: session.mentee_id || session.client_id || '',
      type: session.type || 'Sessão Individual',
      duration: session.duration || 60,
      status: session.status || 'Concluída',
      notes: session.notes || '',
      discussion: session.discussion || '',
      tasks: session.tasks || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.personId) {
      setErrors({ personId: 'Selecione um cliente ou mentorado' })
      return
    }

    setSaving(true)
    try {
      const selectedOption = options.find((o) => o.id === formData.personId)

      const dataToSave = {
        date: formData.date ? new Date(formData.date + 'T12:00:00Z').toISOString() : null,
        type: formData.type,
        duration: formData.duration,
        status: formData.status,
        notes: formData.notes,
        discussion: formData.discussion,
        tasks: formData.tasks,
        mentee_id: selectedOption?.type === 'mentee' ? selectedOption.id : '',
        client_id: selectedOption?.type === 'client' ? selectedOption.id : '',
      }

      if (editingSession) {
        await pb.collection('v1_sessoes').update(editingSession.id, dataToSave)
        showToast('Prontuário atualizado com sucesso')
      } else {
        await pb.collection('v1_sessoes').create(dataToSave)
        showToast('Prontuário criado com sucesso')
      }
      handleOpenChange(false)
    } catch (err: any) {
      setErrors(extractFieldErrors(err))
      showToast(err.message || 'Erro ao salvar prontuário', true)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este prontuário?')) return
    try {
      await pb.collection('v1_sessoes').delete(id)
      showToast('Prontuário excluído')
    } catch (err) {
      showToast('Erro ao excluir', true)
    }
  }

  const filteredSessoes = sessoes.filter((s) => {
    const personName = (s.expand?.mentee_id?.name || s.expand?.client_id?.name || '').toLowerCase()
    const notes = s.notes?.toLowerCase() || ''
    const disc = s.discussion?.toLowerCase() || ''
    const term = search.toLowerCase()
    return personName.includes(term) || notes.includes(term) || disc.includes(term)
  })

  return (
    <div className="space-y-6 relative animate-fade-in-up">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-medium animate-in fade-in slide-in-from-top-4 ${toastMessage.error ? 'bg-red-500' : 'bg-green-500'}`}
        >
          {toastMessage.title}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2D9289]">Prontuários Gerais</h1>
          <p className="text-muted-foreground mt-1">Histórico completo de sessões do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-[#2D9289] hover:bg-[#2D9289]/90 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Prontuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#2D9289]">
                {editingSession ? 'Editar Prontuário' : 'Novo Prontuário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Vincular A <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.personId}
                    onValueChange={(val) => setFormData((p) => ({ ...p, personId: val }))}
                  >
                    <SelectTrigger className={errors.personId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.personId && <p className="text-xs text-red-500">{errors.personId}</p>}
                </div>
                <div className="space-y-2">
                  <Label>
                    Data <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    className={errors.date ? 'border-red-500' : ''}
                  />
                  {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Sessão</Label>
                  <Input
                    placeholder="Ex: Sessão Individual"
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Duração (min)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, duration: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) => setFormData((p) => ({ ...p, status: val }))}
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
                  placeholder="Registre os pontos principais..."
                  value={formData.discussion}
                  onChange={(e) => setFormData((p) => ({ ...p, discussion: e.target.value }))}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Tarefas / Próximos Passos</Label>
                <Textarea
                  rows={3}
                  placeholder="Liste as tarefas..."
                  value={formData.tasks}
                  onChange={(e) => setFormData((p) => ({ ...p, tasks: e.target.value }))}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Observações Gerais</Label>
                <Textarea
                  rows={2}
                  placeholder="Notas adicionais..."
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="resize-none"
                />
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2D9289] hover:bg-[#2D9289]/90 text-white"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Prontuário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm max-w-md focus-within:ring-2 focus-within:ring-[#2D9289]/20 focus-within:border-[#2D9289] transition-all">
        <Search className="h-5 w-5 text-muted-foreground mr-2" />
        <Input
          type="text"
          placeholder="Buscar por pessoa, notas ou discussão..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 p-0 h-auto focus-visible:ring-0 shadow-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-[#2D9289]/20 border-t-[#2D9289] rounded-full animate-spin"></div>
        </div>
      ) : filteredSessoes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed shadow-sm">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800">Nenhum prontuário encontrado</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-1">
            Busque ou cadastre um novo registro.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessoes.map((session) => {
            const personName =
              session.expand?.mentee_id?.name || session.expand?.client_id?.name || 'Não informado'
            const badgeType = session.mentee_id
              ? 'Mentorado'
              : session.client_id
                ? 'Cliente'
                : 'Avulso'

            return (
              <Card
                key={session.id}
                className="overflow-hidden hover:shadow-md hover:border-[#2D9289]/30 transition-all duration-200 group"
              >
                <div
                  className={cn(
                    'h-1.5 w-full',
                    session.status === 'Concluída'
                      ? 'bg-[#2D9289]'
                      : session.status === 'Agendada'
                        ? 'bg-blue-400'
                        : 'bg-gray-300',
                  )}
                />
                <CardHeader className="pb-3 pt-5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CardTitle className="text-lg leading-tight truncate text-slate-800">
                          {personName}
                        </CardTitle>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase font-semibold">
                        {badgeType}
                      </span>
                      <CardDescription className="flex items-center gap-2 mt-2 text-xs font-medium">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {session.date ? format(parseISO(session.date), 'dd/MM/yyyy') : 'N/A'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="h-3.5 w-3.5" /> {session.duration} min
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(session)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm mt-1">
                    {session.discussion && (
                      <div>
                        <p className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1">
                          <FileText className="h-3.5 w-3.5 text-[#2D9289]" /> Discussão
                        </p>
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {session.discussion}
                        </p>
                      </div>
                    )}
                    {session.tasks && (
                      <div>
                        <p className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1">
                          <Clock className="h-3.5 w-3.5 text-[#2D9289]" /> Tarefas
                        </p>
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {session.tasks}
                        </p>
                      </div>
                    )}
                    {!session.discussion && !session.tasks && session.notes && (
                      <div>
                        <p className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1">
                          Notas
                        </p>
                        <p className="text-slate-600 line-clamp-3 leading-relaxed">
                          {session.notes}
                        </p>
                      </div>
                    )}
                    {!session.discussion && !session.tasks && !session.notes && (
                      <p className="text-slate-400 italic text-center py-2 bg-slate-50 rounded-md">
                        Nenhum detalhe registrado.
                      </p>
                    )}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                      {session.type || 'Sessão'}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-md font-semibold',
                        session.status === 'Concluída'
                          ? 'bg-teal-50 text-[#2D9289] border border-teal-100'
                          : session.status === 'Agendada'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-gray-100 text-gray-700 border border-gray-200',
                      )}
                    >
                      {session.status || 'Concluída'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
