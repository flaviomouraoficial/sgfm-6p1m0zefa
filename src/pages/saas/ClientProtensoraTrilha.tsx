import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ClientProtensoraTrilha() {
  const { trilhaId } = useParams()
  const [trilha, setTrilha] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (!trilhaId) return
      try {
        const t = await pb.collection('v1_protensora_trilhas').getOne(trilhaId)
        setTrilha(t)
        const m = await pb
          .collection('v1_protensora_modulos')
          .getFullList({ filter: `trilha_id='${trilhaId}'`, sort: 'order' })
        setModulos(m)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [trilhaId])

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" asChild size="sm">
          <Link to="/dashboard/protensora">&larr; Voltar</Link>
        </Button>
        <h2 className="text-2xl font-bold text-foreground">{trilha?.name}</h2>
      </div>
      <p className="text-muted-foreground text-sm">
        {trilha?.description ||
          'Selecione um dos módulos abaixo para iniciar ou continuar seus estudos.'}
      </p>
      <div className="space-y-4">
        {modulos.map((m, i) => (
          <Card key={m.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="py-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-1">
                    Módulo {i + 1}
                  </p>
                  <CardTitle className="text-lg">{m.name}</CardTitle>
                </div>
                <Button asChild className="bg-[#1e3a8a] text-white">
                  <Link to={`/dashboard/protensora/modulo/${m.id}`}>Acessar Módulo</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
        {modulos.length === 0 && (
          <div className="py-12 text-center text-muted-foreground border rounded-xl">
            <p>Nenhum módulo cadastrado nesta trilha.</p>
          </div>
        )}
      </div>
    </div>
  )
}
