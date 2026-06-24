import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function ProtensoraQuestoes() {
  const { moduloId } = useParams()
  const [questoes, setQuestoes] = useState<any[]>([])
  const [modulo, setModulo] = useState<any>(null)
  const [text, setText] = useState('')
  const [type, setType] = useState('multiple_choice')
  const [choices, setChoices] = useState('Opção A, Opção B, Opção C, Opção D')
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      if (!moduloId) return
      try {
        const m = await pb.collection('v1_protensora_modulos').getOne(moduloId)
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

  async function createQuestao() {
    if (!text || !moduloId) return
    const options =
      type === 'multiple_choice' ? { choices: choices.split(',').map((c) => c.trim()) } : {}
    try {
      await pb.collection('v1_protensora_questoes').create({
        modulo_id: moduloId,
        text,
        type,
        weight: 1,
        order: questoes.length + 1,
        options,
      })
      setText('')
      const q = await pb
        .collection('v1_protensora_questoes')
        .getFullList({ filter: `modulo_id='${moduloId}'`, sort: 'order' })
      setQuestoes(q)
      toast({ title: 'Questão criada com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao criar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/admin/saas/protensora/trilhas">&larr; Voltar</Link>
        </Button>
        <h2 className="text-2xl font-bold text-[#1e3a8a]">Questões: {modulo?.name}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Questão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Texto descritivo da questão..."
                className="flex-1"
              />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                  <SelectItem value="text">Texto Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === 'multiple_choice' && (
              <Input
                value={choices}
                onChange={(e) => setChoices(e.target.value)}
                placeholder="Opções de resposta separadas por vírgula"
              />
            )}
            <Button
              onClick={createQuestao}
              className="w-full md:w-auto self-end bg-[#1e3a8a] text-white"
            >
              Salvar Questão
            </Button>
          </div>
          <div className="mt-8 space-y-3">
            {questoes.map((q, i) => (
              <div key={q.id} className="p-4 border rounded-md shadow-sm">
                <p className="font-medium text-sm mb-3 text-foreground">
                  {i + 1}. {q.text}
                </p>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                    {q.type === 'text' ? 'Texto Livre' : 'Múltipla Escolha'}
                  </span>
                  {q.type === 'multiple_choice' && (
                    <span className="text-xs text-muted-foreground bg-blue-50 text-blue-800 px-2 py-1 rounded">
                      {q.options?.choices?.join(' | ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
