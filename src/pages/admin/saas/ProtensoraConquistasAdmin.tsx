import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Trophy, Plus, Trash2 } from 'lucide-react'

export default function ProtensoraConquistasAdmin() {
  const [conquistas, setConquistas] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConquista, setEditingConquista] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [conquistaToDelete, setConquistaToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  async function load() {
    try {
      const data = await pb.collection('v1_protensora_conquistas').getFullList()
      setConquistas(data)
    } catch (err: any) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const data = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      icon: form.get('icon') as string,
      requirement_type: form.get('requirement_type') as string,
      requirement_value: Number(form.get('requirement_value')) || 0,
    }
    const id = form.get('id') as string

    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_conquistas').update(id, data)
      else await pb.collection('v1_protensora_conquistas').create(data)
      toast({ title: 'Sucesso', description: 'Conquista salva!' })
      setIsDialogOpen(false)
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!conquistaToDelete) return
    setIsDeleting(true)
    try {
      await pb.collection('v1_protensora_conquistas').delete(conquistaToDelete)
      toast({ title: 'Sucesso', description: 'Conquista excluída!' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setConquistaToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Gestão de Conquistas</h2>
        <Button
          className="bg-[#1e3a8a]"
          onClick={() => {
            setEditingConquista(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Conquista
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => !saving && setIsDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConquista ? 'Editar Conquista' : 'Nova Conquista'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {editingConquista && <input type="hidden" name="id" value={editingConquista.id} />}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                name="name"
                defaultValue={editingConquista?.name || ''}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                name="description"
                defaultValue={editingConquista?.description || ''}
                required
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ícone (Emoji ou classe)</Label>
                <Input
                  name="icon"
                  defaultValue={editingConquista?.icon || '🏆'}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Requisito</Label>
                <Select
                  name="requirement_type"
                  defaultValue={editingConquista?.requirement_type || 'module_done'}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_step">Primeiro Passo</SelectItem>
                    <SelectItem value="module_done">Módulo Concluído</SelectItem>
                    <SelectItem value="trail_master">Mestre de Trilha</SelectItem>
                    <SelectItem value="perfect_score">Pontuação Perfeita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor do Requisito (opcional)</Label>
              <Input
                name="requirement_value"
                type="number"
                defaultValue={editingConquista?.requirement_value || 0}
                disabled={saving}
              />
            </div>
            <Button type="submit" className="w-full bg-[#1e3a8a]" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!conquistaToDelete}
        onOpenChange={(o) => !o && !isDeleting && setConquistaToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conquista</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conquista?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {conquistas.map((c) => (
          <Card key={c.id} className="text-center border-amber-200 bg-amber-50/50 relative group">
            <CardContent className="pt-6">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-blue-500 bg-white shadow-sm"
                  onClick={() => {
                    setEditingConquista(c)
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 bg-white shadow-sm"
                  onClick={() => setConquistaToDelete(c.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-4xl mb-3">{c.icon || '🏆'}</div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{c.name}</h4>
              <p className="text-xs text-muted-foreground">{c.description}</p>
              <div className="mt-3 text-[10px] uppercase font-bold text-amber-600 bg-amber-100 py-1 rounded">
                {c.requirement_type}
              </div>
            </CardContent>
          </Card>
        ))}
        {conquistas.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 border border-dashed rounded-xl">
            Nenhuma conquista cadastrada.
          </div>
        )}
      </div>
    </div>
  )
}
