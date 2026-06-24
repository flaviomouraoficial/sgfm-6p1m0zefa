import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

export default function ProtensoraTrilhas() {
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [modulos, setModulos] = useState<any[]>([])
  const [name, setName] = useState('')
  const [activeTrilha, setActiveTrilha] = useState<any>(null)
  const { toast } = useToast()

  async function loadTrilhas() {
    try {
      const t = await pb.collection('v1_protensora_trilhas').getFullList({ sort: '-created' })
      setTrilhas(t)
    } catch (e) {
      console.error(e)
    }
  }

  async function loadModulos(trilhaId: string) {
    try {
      const m = await pb
        .collection('v1_protensora_modulos')
        .getFullList({ filter: `trilha_id='${trilhaId}'`, sort: 'order' })
      setModulos(m)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadTrilhas()
  }, [])

  async function createTrilha() {
    if (!name) return
    try {
      await pb.collection('v1_protensora_trilhas').create({ name, active: true })
      setName('')
      loadTrilhas()
      toast({ title: 'Trilha criada!' })
    } catch (e) {
      toast({ title: 'Erro ao criar', variant: 'destructive' })
    }
  }

  async function createModulo() {
    if (!name || !activeTrilha) return
    try {
      await pb
        .collection('v1_protensora_modulos')
        .create({ trilha_id: activeTrilha.id, name, order: modulos.length + 1 })
      setName('')
      loadModulos(activeTrilha.id)
      toast({ title: 'Módulo criado!' })
    } catch (e) {
      toast({ title: 'Erro ao criar', variant: 'destructive' })
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTrilha ? `Módulos: ${activeTrilha.name}` : 'Trilhas de Aprendizagem'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={activeTrilha ? 'Nome do módulo' : 'Nome da trilha'}
            />
            <Button
              onClick={activeTrilha ? createModulo : createTrilha}
              className="bg-[#1e3a8a] text-white"
            >
              Criar
            </Button>
          </div>
          {activeTrilha && (
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => {
                setActiveTrilha(null)
                setModulos([])
              }}
            >
              &larr; Voltar para Trilhas
            </Button>
          )}
          <div className="space-y-2">
            {!activeTrilha
              ? trilhas.map((t) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm">{t.name}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveTrilha(t)
                        loadModulos(t.id)
                        setName('')
                      }}
                    >
                      Módulos
                    </Button>
                  </div>
                ))
              : modulos.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm">
                      {i + 1}. {m.name}
                    </span>
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/admin/saas/protensora/modulos/${m.id}/questoes`}>Questões</Link>
                    </Button>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
