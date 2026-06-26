import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProtensoraQuestoes() {
  const { moduloId } = useParams()
  const { toast } = useToast()

  const [modulo, setModulo] = useState<any>(null)
  const [questoes, setQuestoes] = useState<any[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [type, setType] = useState('multiple_choice')
  const [weight, setWeight] = useState(1)
  const [choices, setChoices] = useState<string[]>(['', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!moduloId) return
      try {
        const m = await pb
          .collection('v1_protensora_modulos')
          .getOne(moduloId, { expand: 'trilha_id' })
        setModulo(m)
        const q = await pb
          .collection('v1_protensora_questoes')
          .getFullList({ filter: `modulo_id='${moduloId}'`, sort: 'order' })
        setQuestoes(q)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [moduloId])

  const resetForm = () => {
    setEditingId(null)
    setText('')
    setType('multiple_choice')
    setWeight(1)
    setChoices(['', ''])
    setCorrectAnswer('')
  }

  const edit = (q: any) => {
    setEditingId(q.id)
    setText(q.text)
    setType(q.type)
    setWeight(q.weight || 1)
    setChoices(q.options?.choices || ['', ''])
    setCorrectAnswer(q.options?.correct || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    if (!text) return toast({ title: 'Texto obrigatório', variant: 'destructive' })
    if (type === 'multiple_choice' && choices.filter((c) => c.trim()).length < 2) {
      return toast({ title: 'Adicione pelo menos 2 opções', variant: 'destructive' })
    }

    setLoading(true)
    try {
      const payload = {
        modulo_id: moduloId,
        text,
        type,
        weight: Number(weight),
        order: editingId ? questoes.find((q) => q.id === editingId)?.order : questoes.length + 1,
        options:
          type === 'multiple_choice'
            ? { choices: choices.filter((c) => c.trim()), correct: correctAnswer }
            : null,
      }

      if (editingId) {
        await pb.collection('v1_protensora_questoes').update(editingId, payload)
        toast({ title: 'Questão atualizada com sucesso' })
      } else {
        await pb.collection('v1_protensora_questoes').create(payload)
        toast({ title: 'Questão criada com sucesso' })
      }

      const q = await pb
        .collection('v1_protensora_questoes')
        .getFullList({ filter: `modulo_id='${moduloId}'`, sort: 'order' })
      setQuestoes(q)
      resetForm()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir esta questão?')) return
    try {
      await pb.collection('v1_protensora_questoes').delete(id)
      setQuestoes((q) => q.filter((x) => x.id !== id))
      toast({ title: 'Questão excluída' })
    } catch (err) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/admin/saas/protensora/trilhas">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-[#1e3a8a]">Questões do Módulo</h2>
          <p className="text-muted-foreground">
            {modulo?.name} ({modulo?.expand?.trilha_id?.name})
          </p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>{editingId ? 'Editar Questão' : 'Nova Questão'}</CardTitle>
          <CardDescription>
            Defina o texto, opções, peso (pontos) e a resposta correta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label>Texto da Questão</Label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: O que é fluxo de caixa?"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso (Pontos)</Label>
              <Input
                type="number"
                min={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Questão</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                  <SelectItem value="text">Texto Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'multiple_choice' && (
            <div className="mt-4 p-4 border rounded-md bg-slate-50 space-y-4">
              <Label className="font-semibold text-[#1e3a8a]">Opções de Resposta</Label>
              {choices.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={c}
                    onChange={(e) => {
                      const nc = [...choices]
                      nc[i] = e.target.value
                      setChoices(nc)
                      if (correctAnswer === c) setCorrectAnswer(e.target.value)
                    }}
                    placeholder={`Opção ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setChoices(choices.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setChoices([...choices, ''])}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Opção
              </Button>

              <div className="mt-4 pt-4 border-t space-y-2">
                <Label className="text-[#1e3a8a]">Opção Correta (Para Gamificação / Pontos)</Label>
                <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a correta (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {choices
                      .filter((c) => c.trim())
                      .map((c, i) => (
                        <SelectItem key={i} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Se nenhuma for marcada como correta, qualquer resposta escolhida dará a pontuação
                  total da questão.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {editingId && (
            <Button variant="ghost" onClick={resetForm}>
              Cancelar
            </Button>
          )}
          <Button onClick={save} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Questão'}
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Questões Cadastradas ({questoes.length})</h3>
        {questoes.map((q, i) => (
          <Card key={q.id}>
            <CardHeader className="py-4 flex flex-row items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Questão {i + 1} - Peso: {q.weight || 1} pts
                </p>
                <CardTitle className="text-base mt-1">{q.text}</CardTitle>
                {q.type === 'multiple_choice' && q.options?.correct && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Correta: {q.options.correct}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => edit(q)}>
                  Editar
                </Button>
                <Button variant="destructive" size="icon" onClick={() => remove(q.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
