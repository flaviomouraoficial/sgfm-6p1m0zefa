import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Plus, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export default function ProtensoraCaminhosAdmin() {
  const [reforcos, setReforcos] = useState<any[]>([])
  const [avancos, setAvancos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [questoes, setQuestoes] = useState<any[]>([])
  const [modulos, setModulos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isReforcoDialog, setIsReforcoDialog] = useState(false)
  const [editingReforco, setEditingReforco] = useState<any>(null)

  const [isAvancoDialog, setIsAvancoDialog] = useState(false)
  const [editingAvanco, setEditingAvanco] = useState<any>(null)

  const [saving, setSaving] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    type: 'reforco' | 'avanco'
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  async function load() {
    try {
      const [ref, ava, un, q, mod] = await Promise.all([
        pb
          .collection('v1_protensora_reforco')
          .getFullList({ expand: 'unidade_id,questao_id', sort: '-created' }),
        pb
          .collection('v1_protensora_avanco')
          .getFullList({ expand: 'unidade_origem_id,modulo_id', sort: '-created' }),
        pb.collection('v1_protensora_unidades').getFullList({ sort: 'titulo' }),
        pb.collection('v1_protensora_questoes').getFullList({ sort: 'text' }),
        pb.collection('v1_protensora_modulos').getFullList({ sort: 'name' }),
      ])
      setReforcos(ref)
      setAvancos(ava)
      setUnidades(un)
      setQuestoes(q)
      setModulos(mod)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSaveReforco = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      titulo: form.get('titulo') as string,
      texto: form.get('texto') as string,
      unidade_id: form.get('unidade_id') as string,
      questao_id: (form.get('questao_id') as string) || null,
    }
    const id = form.get('id') as string
    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_reforco').update(id, data)
      else await pb.collection('v1_protensora_reforco').create(data)
      toast({ title: 'Sucesso', description: 'Reforço salvo!' })
      setIsReforcoDialog(false)
      load()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAvanco = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      titulo: form.get('titulo') as string,
      texto: form.get('texto') as string,
      xp_bonus: Number(form.get('xp_bonus')) || 0,
      unidade_origem_id: (form.get('unidade_origem_id') as string) || null,
      modulo_id: (form.get('modulo_id') as string) || null,
    }
    const id = form.get('id') as string
    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_avanco').update(id, data)
      else await pb.collection('v1_protensora_avanco').create(data)
      toast({ title: 'Sucesso', description: 'Avanço salvo!' })
      setIsAvancoDialog(false)
      load()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      const col = itemToDelete.type === 'reforco' ? 'v1_protensora_reforco' : 'v1_protensora_avanco'
      await pb.collection(col).delete(itemToDelete.id)
      toast({ title: 'Sucesso', description: 'Item excluído!' })
      load()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-[#1e3a8a]">Caminhos Adaptativos</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie o conteúdo exibido aos alunos com base no desempenho. (Abaixo de 50% = Reforço
            | Acima de 80% = Avanço).
          </p>
        </div>
      </div>

      <Tabs defaultValue="reforco" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reforco">Conteúdo de Reforço</TabsTrigger>
          <TabsTrigger value="avanco">Conteúdo de Avanço (Desafios)</TabsTrigger>
        </TabsList>

        {/* Dialogs */}
        <Dialog open={isReforcoDialog} onOpenChange={(o) => !saving && setIsReforcoDialog(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingReforco ? 'Editar Reforço' : 'Novo Reforço'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveReforco} className="space-y-4">
              {editingReforco && <input type="hidden" name="id" value={editingReforco.id} />}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  name="titulo"
                  defaultValue={editingReforco?.titulo || ''}
                  required
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Aula Vinculada</Label>
                <Select
                  name="unidade_id"
                  defaultValue={editingReforco?.unidade_id || ''}
                  required
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma aula" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Questão Específica (Opcional)</Label>
                <Select
                  name="questao_id"
                  defaultValue={editingReforco?.questao_id || ''}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a questão que aciona este reforço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {questoes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.text.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Reforço (HTML permitido)</Label>
                <Textarea
                  name="texto"
                  rows={5}
                  defaultValue={editingReforco?.texto || ''}
                  disabled={saving}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Reforço'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAvancoDialog} onOpenChange={(o) => !saving && setIsAvancoDialog(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAvanco ? 'Editar Avanço' : 'Novo Avanço'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveAvanco} className="space-y-4">
              {editingAvanco && <input type="hidden" name="id" value={editingAvanco.id} />}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  name="titulo"
                  defaultValue={editingAvanco?.titulo || ''}
                  required
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Aula Origem (Opcional)</Label>
                <Select
                  name="unidade_origem_id"
                  defaultValue={editingAvanco?.unidade_origem_id || ''}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma aula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Módulo (Opcional)</Label>
                <Select
                  name="modulo_id"
                  defaultValue={editingAvanco?.modulo_id || ''}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {modulos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>XP Bônus</Label>
                <Input
                  name="xp_bonus"
                  type="number"
                  defaultValue={editingAvanco?.xp_bonus || 0}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Avanço/Desafio (HTML permitido)</Label>
                <Textarea
                  name="texto"
                  rows={5}
                  defaultValue={editingAvanco?.texto || ''}
                  disabled={saving}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Avanço'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!itemToDelete}
          onOpenChange={(o) => !o && !isDeleting && setItemToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Item</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este conteúdo adaptativo?
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

        <TabsContent value="reforco" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reforços Cadastrados</CardTitle>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  setEditingReforco(null)
                  setIsReforcoDialog(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Reforço
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-4 text-center">Carregando...</div>
              ) : reforcos.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  Nenhum conteúdo de reforço cadastrado. Acesse a edição de Aulas para adicionar.
                </div>
              ) : (
                <div className="grid gap-4">
                  {reforcos.map((r) => (
                    <div key={r.id} className="p-4 border rounded-lg bg-red-50/30 border-red-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-red-900">{r.titulo}</h4>
                          <p className="text-xs text-red-600 font-medium">
                            Vinculado à Aula: {r.expand?.unidade_id?.titulo || 'Desconhecida'}
                            {r.expand?.questao_id && (
                              <span>
                                {' '}
                                | Questão: {r.expand.questao_id.text.substring(0, 30)}...
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500"
                            onClick={() => {
                              setEditingReforco(r)
                              setIsReforcoDialog(true)
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setItemToDelete({ id: r.id, type: 'reforco' })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="text-sm text-slate-700 bg-white p-3 rounded border border-red-100/50 mt-2 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: r.texto }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avanco" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Desafios / Avanços Cadastrados</CardTitle>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setEditingAvanco(null)
                  setIsAvancoDialog(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Novo Avanço
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-4 text-center">Carregando...</div>
              ) : avancos.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  Nenhum conteúdo de avanço cadastrado. Acesse a edição de Aulas para adicionar.
                </div>
              ) : (
                <div className="grid gap-4">
                  {avancos.map((a) => (
                    <div key={a.id} className="p-4 border rounded-lg bg-blue-50/30 border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-blue-900">{a.titulo}</h4>
                          <p className="text-xs text-blue-600 font-medium">
                            Vinculado à Aula:{' '}
                            {a.expand?.unidade_origem_id?.titulo || 'Desconhecida'}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          {a.xp_bonus > 0 && (
                            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              +{a.xp_bonus} XP
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500"
                            onClick={() => {
                              setEditingAvanco(a)
                              setIsAvancoDialog(true)
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => setItemToDelete({ id: a.id, type: 'avanco' })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="text-sm text-slate-700 bg-white p-3 rounded border border-blue-100/50 mt-2 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: a.texto }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
