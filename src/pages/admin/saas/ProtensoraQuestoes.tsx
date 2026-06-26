import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/hooks/use-toast'
import { Plus, ArrowLeft, Trash2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function ProtensoraQuestoesAdmin() {
  const { unidadeId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [unidade, setUnidade] = useState<any>(null)
  const [questoes, setQuestoes] = useState<any[]>([])
  const [editingQuestao, setEditingQuestao] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [questaoToDelete, setQuestaoToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    load()
  }, [unidadeId])

  async function load() {
    if (!unidadeId) return
    try {
      const u = await pb
        .collection('v1_protensora_unidades')
        .getOne(unidadeId, { expand: 'modulo_id' })
      setUnidade(u)
      const q = await pb
        .collection('v1_protensora_questoes')
        .getFullList({ filter: `unidade_id='${unidadeId}'`, sort: 'order' })
      setQuestoes(q)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const handleSaveQuestao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const altText = form.get('alternativas') as string
    const alternativas = altText
      .split('\n')
      .filter((s) => s.trim())
      .map((s, i) => ({ id: i.toString(), texto: s.trim() }))

    const typeValue = form.get('tipo') as string

    const data = {
      unidade_id: unidadeId,
      modulo_id: unidade?.modulo_id,
      text: form.get('text') as string,
      type: typeValue,
      alternativas: alternativas,
      resposta_correta: form.get('resposta_correta') as string,
      explicacao: form.get('explicacao') as string,
      xp_acerto: Number(form.get('xp_acerto')) || 50,
      weight: Number(form.get('xp_acerto')) || 50,
      order: Number(form.get('order')) || questoes.length + 1,
    }

    const id = form.get('id') as string

    setSaving(true)
    try {
      if (id) await pb.collection('v1_protensora_questoes').update(id, data)
      else await pb.collection('v1_protensora_questoes').create(data)
      toast({ title: 'Sucesso', description: 'Questão salva com sucesso!' })
      setIsDialogOpen(false)
      load()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!questaoToDelete) return
    setIsDeleting(true)
    try {
      await pb.collection('v1_protensora_questoes').delete(questaoToDelete)
      toast({ title: 'Sucesso', description: 'Questão excluída com sucesso!' })
      load()
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(e), variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setQuestaoToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-4 text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Aulas
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[#1e3a8a]">Quiz: {unidade?.titulo}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure as perguntas para liberar o XP da aula.
          </p>
        </div>
        <Button
          className="bg-[#1e3a8a]"
          onClick={() => {
            setEditingQuestao(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Questão
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => !saving && setIsDialogOpen(o)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuestao ? 'Editar Questão' : 'Nova Questão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveQuestao} className="space-y-4">
            {editingQuestao && <input type="hidden" name="id" value={editingQuestao.id} />}
            <div className="space-y-2">
              <Label>Enunciado (Pergunta)</Label>
              <Textarea
                name="text"
                defaultValue={editingQuestao?.text || ''}
                required
                rows={2}
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  name="tipo"
                  defaultValue={editingQuestao?.type || 'multiple_choice'}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                    <SelectItem value="text">Texto / Certo-Errado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>XP de Acerto</Label>
                <Input
                  name="xp_acerto"
                  type="number"
                  defaultValue={editingQuestao?.xp_acerto || editingQuestao?.weight || 50}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alternativas (Uma por linha)</Label>
              <Textarea
                name="alternativas"
                rows={4}
                defaultValue={
                  editingQuestao?.alternativas?.map((a: any) => a.texto).join('\n') || ''
                }
                placeholder="Opção A&#10;Opção B&#10;Opção C"
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Resposta Correta (Índice 0, 1, 2... correspondente à linha correta)</Label>
              <Input
                name="resposta_correta"
                defaultValue={editingQuestao?.resposta_correta || ''}
                required
                placeholder="Ex: 0"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Explicação (Feedback ao aluno)</Label>
              <Input
                name="explicacao"
                defaultValue={editingQuestao?.explicacao || ''}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                name="order"
                type="number"
                defaultValue={editingQuestao?.order || questoes.length + 1}
                disabled={saving}
              />
            </div>
            <Button type="submit" className="w-full bg-[#1e3a8a]" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Questão'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!questaoToDelete}
        onOpenChange={(o) => !o && !isDeleting && setQuestaoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Questão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta questão permanentemente? As respostas dos alunos
              também podem ser afetadas.
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
        {questoes.map((q, i) => (
          <Card key={q.id}>
            <CardHeader className="bg-slate-50 py-3">
              <CardTitle className="text-base flex justify-between items-center">
                <span>
                  {i + 1}. {q.text}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => {
                      setEditingQuestao(q)
                      setIsDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => setQuestaoToDelete(q.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm text-slate-600">
              <div className="grid grid-cols-1 gap-1">
                {(q.alternativas || []).map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2 border rounded ${q.resposta_correta === idx.toString() ? 'border-green-500 bg-green-50 text-green-700 font-bold' : ''}`}
                  >
                    {idx}: {a.texto}
                  </div>
                ))}
              </div>
              <div className="text-amber-600 font-semibold pt-2 border-t mt-3">
                XP: {q.xp_acerto} pts
              </div>
            </CardContent>
          </Card>
        ))}
        {questoes.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl text-slate-400">
            Nenhuma questão cadastrada para o quiz.
          </div>
        )}
      </div>
    </div>
  )
}
