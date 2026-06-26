import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProtensoraTrilhasAdmin() {
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [modulos, setModulos] = useState<any[]>([])
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const t = await pb.collection('v1_protensora_trilhas').getFullList({ sort: '-created' })
    const m = await pb.collection('v1_protensora_modulos').getFullList({ sort: 'order' })
    setTrilhas(t)
    setModulos(m)
  }

  const handleSaveTrilha = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      icone: form.get('icone') as string,
      cor: form.get('cor') as string,
      active: form.get('active') === 'on',
    }
    const id = form.get('id') as string

    try {
      if (id) await pb.collection('v1_protensora_trilhas').update(id, data)
      else await pb.collection('v1_protensora_trilhas').create(data)
      toast({ title: 'Sucesso', description: 'Trilha salva!' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleSaveModulo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      trilha_id: form.get('trilha_id') as string,
      order: Number(form.get('order')),
    }
    const id = form.get('id') as string

    try {
      if (id) await pb.collection('v1_protensora_modulos').update(id, data)
      else await pb.collection('v1_protensora_modulos').create(data)
      toast({ title: 'Sucesso', description: 'Módulo salvo!' })
      load()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Gestão de Trilhas e Módulos</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a8a]">
              <Plus className="w-4 h-4 mr-2" /> Nova Trilha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trilha</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveTrilha} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input name="description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícone (Emoji ou Texto)</Label>
                  <Input name="icone" placeholder="Ex: 🚀" />
                </div>
                <div className="space-y-2">
                  <Label>Cor (Hex)</Label>
                  <Input name="cor" type="color" className="h-10" defaultValue="#1e3a8a" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="active" id="active" defaultChecked />
                <Label htmlFor="active">Ativa</Label>
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {trilhas.map((t) => {
          const tModulos = modulos.filter((m) => m.trilha_id === t.id)
          return (
            <Card key={t.id} className="border-l-4" style={{ borderLeftColor: t.cor || '#1e3a8a' }}>
              <CardHeader className="bg-slate-50 flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {t.icone && <span>{t.icone}</span>} {t.name}
                    {!t.active && (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                        Inativa
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Novo Módulo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Módulo para {t.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveModulo} className="space-y-4">
                      <input type="hidden" name="trilha_id" value={t.id} />
                      <div className="space-y-2">
                        <Label>Nome do Módulo</Label>
                        <Input name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input name="description" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ordem</Label>
                        <Input name="order" type="number" defaultValue={tModulos.length + 1} />
                      </div>
                      <Button type="submit" className="w-full">
                        Salvar Módulo
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {tModulos.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {m.order}. {m.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/admin/saas/protensora/modulos/${m.id}/unidades`)}
                      >
                        <Layers className="w-4 h-4 mr-2" /> Gerenciar Aulas (Unidades)
                      </Button>
                    </div>
                  ))}
                  {tModulos.length === 0 && (
                    <p className="text-sm text-slate-400 italic">Nenhum módulo cadastrado.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
