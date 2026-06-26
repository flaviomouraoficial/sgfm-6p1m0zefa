import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, ArrowLeft, Settings2 } from 'lucide-react'

export default function ProtensoraUnidadesAdmin() {
  const { moduloId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [modulo, setModulo] = useState<any>(null)
  const [unidades, setUnidades] = useState<any[]>([])

  useEffect(() => {
    load()
  }, [moduloId])

  async function load() {
    if (!moduloId) return
    const m = await pb.collection('v1_protensora_modulos').getOne(moduloId, { expand: 'trilha_id' })
    setModulo(m)
    const u = await pb
      .collection('v1_protensora_unidades')
      .getFullList({ filter: `modulo_id='${moduloId}'`, sort: 'ordem' })
    setUnidades(u)
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

    try {
      if (id) await pb.collection('v1_protensora_unidades').update(id, data)
      else await pb.collection('v1_protensora_unidades').create(data)
      toast({ title: 'Sucesso', description: 'Aula salva!' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
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
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a]">
              <Plus className="w-4 h-4 mr-2" /> Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Aula (Unidade)</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveUnidade} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input name="titulo" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição Curta</Label>
                <Input name="descricao" />
              </div>
              <div className="space-y-2">
                <Label>URL do Vídeo</Label>
                <Input name="video_url" type="url" placeholder="https://youtube.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Texto de Apoio (Opcional)</Label>
                <Textarea
                  name="texto_apoio"
                  rows={4}
                  placeholder="Conteúdo complementar em texto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input name="ordem" type="number" defaultValue={unidades.length + 1} />
                </div>
                <div className="space-y-2">
                  <Label>XP de Conclusão</Label>
                  <Input name="xp_conclusao" type="number" defaultValue={200} />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  variant="secondary"
                  onClick={() => navigate(`/admin/saas/protensora/unidades/${u.id}/questoes`)}
                >
                  <Settings2 className="w-4 h-4 mr-2" /> Gerenciar Quiz e Reforço
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
