import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Edit2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionsEditor } from '@/components/users/PermissionsEditor'
import { getDefaultPermissions } from '@/lib/permissions'

type Profile = { id: string; name: string; permissions: any }

export function AccessProfilesManager() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<Record<string, any>>(getDefaultPermissions())
  const { toast } = useToast()

  const fetchProfiles = async () => {
    try {
      const records = await pb
        .collection('v1_access_profiles')
        .getFullList<Profile>({ sort: '-created' })
      setProfiles(records)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleCreate = () => {
    setEditingProfile(null)
    setName('')
    setPermissions(getDefaultPermissions())
    setDialogOpen(true)
  }

  const handleEdit = (p: Profile) => {
    setEditingProfile(p)
    setName(p.name)
    setPermissions(p.permissions || getDefaultPermissions())
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este perfil?')) return
    try {
      await pb.collection('v1_access_profiles').delete(id)
      toast({ title: 'Perfil excluído' })
      fetchProfiles()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = { name, permissions }
      if (editingProfile) {
        await pb.collection('v1_access_profiles').update(editingProfile.id, data)
        toast({ title: 'Perfil atualizado' })
      } else {
        await pb.collection('v1_access_profiles').create(data)
        toast({ title: 'Perfil criado' })
      }
      setDialogOpen(false)
      fetchProfiles()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-accent">Modelos de Perfil de Acesso</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Novo Perfil
        </Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome do Perfil</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  Nenhum perfil cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Edit2 className="w-4 h-4 text-accent" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Perfil</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <ScrollArea className="h-[50vh] pr-4 border-t pt-4">
                <PermissionsEditor permissions={permissions} onChange={setPermissions} />
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
