import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DialogFooter,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const PILARES = [
  'Maturidade',
  'Competências',
  'Inteligência Emocional',
  'Visão Estratégica',
  'Liderança',
  'Integridade',
  'Comunicação',
  'Adaptabilidade',
  'Relacionamento Familiar',
  'Mapeamento Agro',
]

export function QuestionManager({
  questions,
  fetchQuestions,
}: {
  questions: any[]
  fetchQuestions: () => void
}) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    order: '',
    pilar: '',
    text_short: '',
    text_full: '',
    weight: '1',
  })

  const handleOpenNew = () => {
    setEditingId(null)
    setFormData({
      order: (questions.length + 1).toString(),
      pilar: '',
      text_short: '',
      text_full: '',
      weight: '1',
    })
    setIsOpen(true)
  }

  const handleOpenEdit = (q: any) => {
    setEditingId(q.id)
    setFormData({
      order: q.order.toString(),
      pilar: q.pilar,
      text_short: q.text_short || '',
      text_full: q.text_full,
      weight: (q.weight ?? 1).toString(),
    })
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!formData.pilar) {
      toast({ title: 'Aviso', description: 'Selecione um pilar.', variant: 'destructive' })
      return
    }
    if (!formData.text_full) {
      toast({ title: 'Aviso', description: 'Digite o texto da pergunta.', variant: 'destructive' })
      return
    }

    try {
      const data = {
        order: Number(formData.order),
        pilar: formData.pilar,
        text_short: formData.text_short,
        text_full: formData.text_full,
        weight: Number(formData.weight),
      }

      if (editingId) {
        await pb.collection('v1_assessment_questions').update(editingId, data)
        toast({ title: 'Pergunta atualizada com sucesso.' })
      } else {
        await pb.collection('v1_assessment_questions').create(data)
        toast({ title: 'Pergunta criada com sucesso.' })
      }
      setIsOpen(false)
      fetchQuestions()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar pergunta', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta pergunta?')) return
    try {
      await pb.collection('v1_assessment_questions').delete(id)
      toast({ title: 'Pergunta excluída.' })
      fetchQuestions()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Configuração das Perguntas</CardTitle>
          <CardDescription>
            Gerencie as perguntas do Assessment, seus pilares e pesos para o cálculo.
          </CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew}>
              <Plus className="w-4 h-4 mr-2" /> Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Ordem (Número)</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Peso</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Pilar</Label>
                <Select
                  value={formData.pilar}
                  onValueChange={(v) => setFormData({ ...formData, pilar: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Pilar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PILARES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Texto Curto (Tema)</Label>
                <Input
                  value={formData.text_short}
                  onChange={(e) => setFormData({ ...formData, text_short: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Texto Completo (Aparece no Formulário)</Label>
                <Textarea
                  value={formData.text_full}
                  onChange={(e) => setFormData({ ...formData, text_full: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ordem</TableHead>
                <TableHead className="w-48">Pilar</TableHead>
                <TableHead>Texto Curto</TableHead>
                <TableHead className="w-20 text-center">Peso</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions
                .sort((a, b) => a.order - b.order)
                .map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-center">{q.order}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-700 whitespace-nowrap">
                        {q.pilar}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {q.text_short || q.text_full.substring(0, 50) + '...'}
                      </div>
                      <div
                        className="text-xs text-muted-foreground line-clamp-1"
                        title={q.text_full}
                      >
                        {q.text_full}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{q.weight ?? 1}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(q)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(q.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
