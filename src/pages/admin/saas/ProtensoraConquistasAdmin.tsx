import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Trophy } from 'lucide-react'

export default function ProtensoraConquistasAdmin() {
  const [conquistas, setConquistas] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const data = await pb.collection('v1_protensora_conquistas').getFullList()
        setConquistas(data)
      } catch (err: any) {
        toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Gestão de Conquistas</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {conquistas.map((c) => (
          <Card key={c.id} className="text-center border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <Trophy className="w-10 h-10 mx-auto text-amber-500 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{c.name}</h4>
              <p className="text-xs text-muted-foreground">{c.description}</p>
              <div className="mt-3 text-[10px] uppercase font-bold text-amber-600 bg-amber-100 py-1 rounded">
                {c.requirement_type}
              </div>
            </CardContent>
          </Card>
        ))}
        {conquistas.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 border border-dashed rounded-xl">
            Nenhuma conquista cadastrada.
          </div>
        )}
      </div>
    </div>
  )
}
