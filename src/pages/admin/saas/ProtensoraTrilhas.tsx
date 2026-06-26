import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Layers, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function ProtensoraTrilhasAdmin() {
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [modulos, setModulos] = useState<any[]>([])
  const [isTrilhaDialogOpen, setIsTrilhaDialogOpen] = useState(false)
  const [isModuloDialogOpen, setIsModuloDialogOpen] = useState(false)
  const [editingTrilha, setEditingTrilha] = useState<any>(null)
  const [editingModulo, setEditingModulo] = useState<any>(null)
  const [selectedTrilhaId, setSelectedTrilhaId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const t = await pb.collection('v1_protensora_trilhas').getFullList({ sort: '-created' })
    const m = await pb.collection('v1_protensora_modulos').getFullList({ sort: 'order' })
    setTrilhas(t)
    setModulos(m)
  }

  const handleSaveTrilha = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      icone: form.get('icone') as string,
      cor: form.get('cor') as string,
      active: form.get('active') === 'on',
    }
    const id = form.get('id') as string

    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_trilhas').update(id, data)
      else await pb.collection('v1_protensora_trilhas').create(data)
      toast({ title: 'Sucesso', description: 'Trilha salva!' })
      setIsTrilhaDialogOpen(false)
      load()
    } catch (err: any) {
      const msg = getErrorMessage(err)
      toast({ title: 'Erro ao salvar trilha', description: msg, variant: 'destructive' })
      pb.send('/backend/v1/log-error', {
        method: 'POST',
        body: JSON.stringify({ action: 'save_trilha', message: msg }),
      }).catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTrilha = async (id: string) => {
    if (!confirm('Excluir esta trilha? Módulos e aulas associadas também podem ser afetados.'))
      return
    try {
      await pb.collection('v1_protensora_trilhas').delete(id)
      toast({ title: 'Sucesso', description: 'Trilha excluída!' })
      load()
    } catch (err: any) {
      const msg = getErrorMessage(err)
      toast({ title: 'Erro ao excluir trilha', description: msg, variant: 'destructive' })
      pb.send('/backend/v1/log-error', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_trilha', message: msg }),
      }).catch(() => {})
    }
  }

  const handleSaveModulo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      trilha_id: form.get('trilha_id') as string,
      order: Number(form.get('order')),
    }
    const id = form.get('id') as string

    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_modulos').update(id, data)
      else await pb.collection('v1_protensora_modulos').create(data)
      toast({ title: 'Sucesso', description: 'Módulo salvo!' })
      setIsModuloDialogOpen(false)
      load()
    } catch (err: any) {
      const msg = getErrorMessage(err)
      toast({ title: 'Erro ao salvar módulo', description: msg, variant: 'destructive' })
      pb.send('/backend/v1/log-error', {
        method: 'POST',
        body: JSON.stringify({ action: 'save_modulo', message: msg }),
      }).catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModulo = async (id: string) => {
    if (!confirm('Excluir este módulo?')) return
    try {
      await pb.collection('v1_protensora_modulos').delete(id)
      toast({ title: 'Sucesso', description: 'Módulo excluído!' })
      load()
    } catch (err: any) {
      const msg = getErrorMessage(err)
      toast({ title: 'Erro ao excluir módulo', description: msg, variant: 'destructive' })
      pb.send('/backend/v1/log-error', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_modulo', message: msg }),
      }).catch(() => {})
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Gestão de Trilhas e Módulos</h2>
        <Dialog open={isTrilhaDialogOpen} onOpenChange={setIsTrilhaDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a]" onClick={() => setEditingTrilha(null)}>
              <Plus className="w-4 h-4 mr-2" /> Nova Trilha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrilha ? 'Editar Trilha' : 'Nova Trilha'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveTrilha} className="space-y-4">
              {editingTrilha && <input type="hidden" name="id" value={editingTrilha.id} />}
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input name="name" defaultValue={editingTrilha?.name || ''} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input name="description" defaultValue={editingTrilha?.description || ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícone (Emoji ou Texto)</Label>
                  <Input
                    name="icone"
                    defaultValue={editingTrilha?.icone || ''}
                    placeholder="Ex: 🚀"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor (Hex)</Label>
                  <Input
                    name="cor"
                    type="color"
                    className="h-10"
                    defaultValue={editingTrilha?.cor || '#1e3a8a'}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  defaultChecked={editingTrilha ? editingTrilha.active : true}
                />
                <Label htmlFor="active">Ativa</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal for Modulo (moved to root level of this component to manage state easily) */}
        <Dialog open={isModuloDialogOpen} onOpenChange={setIsModuloDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModulo ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveModulo} className="space-y-4">
              {editingModulo && <input type="hidden" name="id" value={editingModulo.id} />}
              <input
                type="hidden"
                name="trilha_id"
                value={editingModulo ? editingModulo.trilha_id : selectedTrilhaId}
              />
              <div className="space-y-2">
                <Label>Nome do Módulo</Label>
                <Input name="name" defaultValue={editingModulo?.name || ''} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input name="description" defaultValue={editingModulo?.description || ''} />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input name="order" type="number" defaultValue={editingModulo?.order || 1} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Módulo'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {trilhas.map((t) => {
          const tModulos = modulos.filter((m) => m.trilha_id === t.id)
          return (
            <Card key={t.id} className="border-l-4" style={{ borderLeftColor: t.cor || '#1e3a8a' }}>
              <CardHeader className="bg-slate-50 flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {t.icone && <span>{t.icone}</span>} {t.name}
                    {!t.active && (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                        Inativa
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTrilha(t)
                      setIsTrilhaDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => handleDeleteTrilha(t.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedTrilhaId(t.id)
                      setEditingModulo({ order: tModulos.length + 1 })
                      setIsModuloDialogOpen(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Novo Módulo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {tModulos.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {m.order}. {m.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => {
                            setEditingModulo(m)
                            setSelectedTrilhaId(t.id)
                            setIsModuloDialogOpen(true)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => handleDeleteModulo(m.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/saas/protensora/modulos/${m.id}/unidades`)
                          }
                        >
                          <Layers className="w-4 h-4 mr-2" /> Aulas
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tModulos.length === 0 && (
                    <p className="text-sm text-slate-400 italic">Nenhum módulo cadastrado.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
