import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { Plus, ArrowLeft, Settings2, Trash2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function ProtensoraUnidadesAdmin() {
  const { moduloId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [modulo, setModulo] = useState<any>(null)
  const [unidades, setUnidades] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [unidadeToDelete, setUnidadeToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    load()
  }, [moduloId])

  async function load() {
    if (!moduloId) return
    try {
      const m = await pb
        .collection('v1_protensora_modulos')
        .getOne(moduloId, { expand: 'trilha_id' })
      setModulo(m)
      const u = await pb
        .collection('v1_protensora_unidades')
        .getFullList({ filter: `modulo_id='${moduloId}'`, sort: 'ordem' })
      setUnidades(u)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const handleSaveUnidade = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      modulo_id: moduloId,
      titulo: form.get('titulo') as string,
      descricao: form.get('descricao') as string,
      video_url: form.get('video_url') as string,
      texto_apoio: form.get('texto_apoio') as string,
      ordem: Number(form.get('ordem')),
      xp_conclusao: Number(form.get('xp_conclusao')) || 200,
    }
    const id = form.get('id') as string

    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_unidades').update(id, data)
      else await pb.collection('v1_protensora_unidades').create(data)
      toast({ title: 'Sucesso', description: 'Aula salva com sucesso!' })
      setIsDialogOpen(false)
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!unidadeToDelete) return
    setIsDeleting(true)
    try {
      await pb.collection('v1_protensora_unidades').delete(unidadeToDelete)
      toast({ title: 'Sucesso', description: 'Aula excluída com sucesso!' })
      load()
    } catch (e: any) {
      toast({ title: 'Erro', description: getErrorMessage(e), variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setUnidadeToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/saas/protensora/trilhas')}
        className="-ml-4 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Trilhas
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#1e3a8a]">Aulas: {modulo?.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Trilha: {modulo?.expand?.trilha_id?.name}
          </p>
        </div>
        <Button
          className="bg-[#1e3a8a]"
          onClick={() => {
            setEditingUnidade(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Aula
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => !saving && setIsDialogOpen(o)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingUnidade ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUnidade} className="space-y-4">
            {editingUnidade && <input type="hidden" name="id" value={editingUnidade.id} />}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                name="titulo"
                defaultValue={editingUnidade?.titulo || ''}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição Curta</Label>
              <Input
                name="descricao"
                defaultValue={editingUnidade?.descricao || ''}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Vídeo</Label>
              <Input
                name="video_url"
                type="url"
                defaultValue={editingUnidade?.video_url || ''}
                placeholder="https://youtube.com/..."
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto de Apoio (Opcional)</Label>
              <Textarea
                name="texto_apoio"
                rows={4}
                defaultValue={editingUnidade?.texto_apoio || ''}
                placeholder="Conteúdo complementar em texto"
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  name="ordem"
                  type="number"
                  defaultValue={editingUnidade?.ordem || unidades.length + 1}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>XP de Conclusão</Label>
                <Input
                  name="xp_conclusao"
                  type="number"
                  defaultValue={editingUnidade?.xp_conclusao || 200}
                  disabled={saving}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#1e3a8a]" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Aula'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!unidadeToDelete}
        onOpenChange={(o) => !o && !isDeleting && setUnidadeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aula? Todas as questões associadas a ela serão
              excluídas.
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

      <div className="space-y-4">
        {unidades.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {u.ordem}. {u.titulo}
                </h3>
                <p className="text-sm text-muted-foreground">{u.descricao}</p>
                <div className="text-xs font-semibold text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-1 rounded">
                  Recompensa: {u.xp_conclusao} XP
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => {
                    setEditingUnidade(u)
                    setIsDialogOpen(true)
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => setUnidadeToDelete(u.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/admin/saas/protensora/unidades/${u.id}/questoes`)}
                >
                  <Settings2 className="w-4 h-4 mr-2" /> Gerenciar Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {unidades.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl text-slate-400">
            Nenhuma aula cadastrada neste módulo.
          </div>
        )}
      </div>
    </div>
  )
}
