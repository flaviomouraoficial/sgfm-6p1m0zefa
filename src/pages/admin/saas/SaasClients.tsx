import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Coins, Edit2 } from 'lucide-react'

export default function SaasClients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [newBalance, setNewBalance] = useState('')
  const { toast } = useToast()

  const fetchClients = async () => {
    try {
      const res = await pb.collection('users').getFullList({ filter: 'role="client"' })
      setClients(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleUpdateBalance = async () => {
    try {
      await pb.collection('users').update(selectedClient.id, {
        balance: parseFloat(newBalance),
      })
      toast({ title: 'Saldo atualizado com sucesso' })
      setSelectedClient(null)
      fetchClients()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Clientes SaaS</h2>
        <p className="text-muted-foreground">
          Visualize os clientes da plataforma e gerencie seus créditos.
        </p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-right">Saldo (Créditos)</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name || 'Sem nome'}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell className="capitalize">{client.plan || 'Básico'}</TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {client.balance || 0}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedClient(client)
                      setNewBalance((client.balance || 0).toString())
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo de Créditos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={selectedClient?.name || selectedClient?.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Novo Saldo</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-9"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateBalance}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
