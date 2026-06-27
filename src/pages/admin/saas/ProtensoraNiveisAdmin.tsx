import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Trash2 } from 'lucide-react'

export default function ProtensoraNiveisAdmin() {
  const [niveis, setNiveis] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNivel, setEditingNivel] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [nivelToDelete, setNivelToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  async function load() {
    try {
      const data = await pb.collection('v1_protensora_niveis').getFullList({ sort: 'nivel' })
      setNiveis(data)
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

    let vantagens = []
    const v = form.get('vantagens') as string
    if (v) {
      vantagens = v.split('\n').filter((s) => s.trim())
    }

    const data = {
      nivel: Number(form.get('nivel')),
      titulo: form.get('titulo') as string,
      xp_minimo: Number(form.get('xp_minimo')),
      xp_maximo: Number(form.get('xp_maximo')),
      vantagens,
    }
    const id = form.get('id') as string

    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_niveis').update(id, data)
      else await pb.collection('v1_protensora_niveis').create(data)
      toast({ title: 'Sucesso', description: 'Nível salvo!' })
      setIsDialogOpen(false)
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!nivelToDelete) return
    setIsDeleting(true)
    try {
      await pb.collection('v1_protensora_niveis').delete(nivelToDelete)
      toast({ title: 'Sucesso', description: 'Nível excluído!' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setNivelToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Níveis e XP</h2>
        <Button
          className="bg-[#1e3a8a]"
          onClick={() => {
            setEditingNivel(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Nível
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => !saving && setIsDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNivel ? 'Editar Nível' : 'Novo Nível'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {editingNivel && <input type="hidden" name="id" value={editingNivel.id} />}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nível</Label>
                <Input
                  name="nivel"
                  type="number"
                  defaultValue={editingNivel?.nivel || niveis.length + 1}
                  required
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  name="titulo"
                  defaultValue={editingNivel?.titulo || ''}
                  required
                  disabled={saving}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>XP Mínimo</Label>
                <Input
                  name="xp_minimo"
                  type="number"
                  defaultValue={editingNivel?.xp_minimo || 0}
                  required
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>XP Máximo</Label>
                <Input
                  name="xp_maximo"
                  type="number"
                  defaultValue={editingNivel?.xp_maximo || 1000}
                  required
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vantagens (Uma por linha)</Label>
              <Textarea
                name="vantagens"
                defaultValue={editingNivel?.vantagens?.join('\n') || ''}
                rows={4}
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
        open={!!nivelToDelete}
        onOpenChange={(o) => !o && !isDeleting && setNivelToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nível</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este nível?
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

      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nível</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="text-right">XP Mínimo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {niveis.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-bold">{n.nivel}</TableCell>
                  <TableCell>{n.titulo}</TableCell>
                  <TableCell className="text-right">{n.xp_minimo} XP</TableCell>
                  <TableCell className="text-right w-[100px]">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500"
                        onClick={() => {
                          setEditingNivel(n)
                          setIsDialogOpen(true)
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => setNivelToDelete(n.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {niveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    Nenhum nível configurado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
