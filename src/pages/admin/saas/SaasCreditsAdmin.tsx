import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditCard, Plus, History } from 'lucide-react'

export default function SaasCreditsAdmin() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedClient, setSelectedClient] = useState('')
  const [manualCredits, setManualCredits] = useState(0)

  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [purchasesRes, clientsRes] = await Promise.all([
        pb
          .collection('v1_saas_credit_purchases')
          .getFullList({ expand: 'client,package', sort: '-created' }),
        pb.collection('users').getFullList({ filter: "role='client'", sort: 'name' }),
      ])
      setPurchases(purchasesRes)
      setClients(clientsRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddManualCredits = async () => {
    if (!selectedClient || manualCredits <= 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione um cliente e informe um valor maior que 0',
        variant: 'destructive',
      })
      return
    }
    try {
      const user = await pb.collection('users').getOne(selectedClient)
      await pb
        .collection('users')
        .update(selectedClient, { balance: (user.balance || 0) + manualCredits })

      await pb.collection('v1_saas_credit_purchases').create({
        client: selectedClient,
        credits: manualCredits,
        price_paid: 0,
        status: 'concluido',
      })

      toast({ title: 'Sucesso', description: 'Créditos adicionados manualmente.' })
      setManualCredits(0)
      setSelectedClient('')
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-primary" />
          Assinatura e Créditos (Admin)
        </h2>
        <p className="text-slate-500 mt-1">
          Gerencie saldos de clientes e visualize o histórico de compras de pacotes.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm max-w-2xl">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Adicionar Créditos Manualmente
          </CardTitle>
          <CardDescription>Atribua créditos sem cobrança direta via plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1 w-full">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.email} ({c.balance || 0} cr)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-full md:w-32">
            <label className="text-sm font-medium">Quantidade</label>
            <Input
              type="number"
              min={1}
              value={manualCredits || ''}
              onChange={(e) => setManualCredits(parseInt(e.target.value) || 0)}
            />
          </div>
          <Button
            onClick={handleAddManualCredits}
            className="w-full md:w-auto bg-primary text-white"
          >
            Adicionar
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-slate-500" /> Histórico Global de Compras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pacote</TableHead>
                <TableHead className="text-center">Créditos</TableHead>
                <TableHead className="text-right">Valor Pago</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhuma compra realizada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((h) => (
                  <TableRow key={h.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {format(new Date(h.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {h.expand?.client?.name || h.expand?.client?.email || 'Desconhecido'}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {h.expand?.package?.name || 'Adição Manual'}
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">
                      +{h.credits}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {(h.price_paid || 0).toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell className="text-center">
                      {h.status === 'concluido' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                          Concluído
                        </Badge>
                      ) : h.status === 'pendente' ? (
                        <Badge
                          variant="outline"
                          className="text-yellow-700 border-yellow-300 bg-yellow-50"
                        >
                          Pendente
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Cancelado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
