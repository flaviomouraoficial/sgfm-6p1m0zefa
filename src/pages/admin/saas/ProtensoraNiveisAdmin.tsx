import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function ProtensoraNiveisAdmin() {
  const [niveis, setNiveis] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const data = await pb.collection('v1_protensora_niveis').getFullList({ sort: 'nivel' })
        setNiveis(data)
      } catch (err: any) {
        toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Níveis e XP</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nível</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="text-right">XP Mínimo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {niveis.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-bold">{n.nivel}</TableCell>
                  <TableCell>{n.titulo}</TableCell>
                  <TableCell className="text-right">{n.xp_minimo} XP</TableCell>
                </TableRow>
              ))}
              {niveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    Nenhum nível configurado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
