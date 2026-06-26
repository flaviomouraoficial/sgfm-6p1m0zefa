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
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { BatteryCharging, RefreshCw } from 'lucide-react'

export default function ProtensoraParticipantesAdmin() {
  const [participantes, setParticipantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  async function load() {
    try {
      const data = await pb
        .collection('v1_protensora_participante_trilhas')
        .getFullList({ expand: 'user_id,trilha_id', sort: '-xp_total' })
      setParticipantes(data)
    } catch (err: any) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rechargeEnergy = async (id: string) => {
    try {
      await pb.collection('v1_protensora_participante_trilhas').update(id, { energia: 100 })
      toast({ title: 'Sucesso', description: 'Energia recarregada para o aluno.' })
      load()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Alunos & Progresso</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participantes e Métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno / Email</TableHead>
                <TableHead>Trilha</TableHead>
                <TableHead className="text-center">Nível</TableHead>
                <TableHead className="text-right">XP Total</TableHead>
                <TableHead className="text-center">Energia</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (
                participantes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-800">
                        {p.expand?.user_id?.name || 'Sem nome'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.expand?.user_id?.email}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.expand?.trilha_id?.name}</TableCell>
                    <TableCell className="text-center font-bold text-[#1e3a8a]">
                      {p.nivel}
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-600">
                      {p.xp_total} XP
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BatteryCharging
                          className={`w-4 h-4 ${p.energia < 20 ? 'text-red-500' : 'text-green-500'}`}
                        />
                        {p.energia}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rechargeEnergy(p.id)}
                        disabled={p.energia >= 100}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Recarregar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && participantes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-20">
                    Nenhum participante encontrado.
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
