import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, RefreshCw, Trash2, Edit } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function Financeiro() {
  const {
    transactions,
    mentees,
    clients,
    addTransaction,
    updateTransaction,
    removeTransaction,
    isSyncing,
  } = useMainStore()

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    type: 'Receita',
    status: 'Pago',
    category: 'Venda de Mentoria',
    date: new Date().toISOString().substring(0, 10),
    account: 'Principal',
    mentee_id: 'none',
    client_id: 'none',
  })

  const [filterType, setFilterType] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')

  const accounts = useMemo(() => {
    const accs = new Set(transactions.map((t: any) => t.account || 'Principal'))
    return Array.from(accs)
  }, [transactions])

  const balances = useMemo(() => {
    const bal: Record<string, number> = {}
    accounts.forEach((a) => (bal[a] = 0))
    transactions.forEach((t: any) => {
      if (t.status === 'Pago') {
        const acc = t.account || 'Principal'
        if (t.type === 'Receita') bal[acc] = (bal[acc] || 0) + t.amount
        else bal[acc] = (bal[acc] || 0) - t.amount
      }
    })
    return bal
  }, [transactions, accounts])

  const filteredTxs = useMemo(() => {
    let res = transactions
    if (filterType !== 'Todos') res = res.filter((t) => t.type === filterType)
    if (filterStatus !== 'Todos') res = res.filter((t) => t.status === filterStatus)
    return res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, filterType, filterStatus])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSave: any = {
        ...formData,
        mentee_id: formData.mentee_id === 'none' ? null : formData.mentee_id,
        client_id: formData.client_id === 'none' ? null : formData.client_id,
      }

      if (editingId) {
        await updateTransaction(editingId, dataToSave)
        toast({ title: 'Sucesso', description: 'Transação atualizada.' })
      } else {
        await addTransaction(dataToSave)
        toast({ title: 'Sucesso', description: 'Transação registrada.' })
      }
      setIsAdding(false)
      setEditingId(null)
      setFormData({
        description: '',
        amount: 0,
        type: 'Receita',
        status: 'Pago',
        category: 'Venda de Mentoria',
        date: new Date().toISOString().substring(0, 10),
        account: 'Principal',
        mentee_id: 'none',
        client_id: 'none',
      })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar transação.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await removeTransaction(id)
        toast({ title: 'Sucesso', description: 'Transação removida.' })
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' })
      }
    }
  }

  const openEdit = (tx: any) => {
    setFormData({
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      category: tx.category,
      date: tx.date.substring(0, 10),
      account: tx.account || 'Principal',
      mentee_id: tx.mentee_id || 'none',
      client_id: tx.client_id || 'none',
    })
    setEditingId(tx.id)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Gestão de contas e transações.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-secondary">
          <Plus className="w-4 h-4 mr-2" /> Nova Transação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Object.entries(balances).map(([acc, bal]) => (
          <Card key={acc} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conta: {acc}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(bal)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4">
          <CardTitle>Histórico de Transações</CardTitle>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTxs.map((t: any) => {
                  const mentee = mentees.find((m) => m.id === t.mentee_id)
                  const client = clients.find((c) => c.id === t.client_id)
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">
                        {t.description}
                        <br />
                        <span className="text-[10px] text-muted-foreground">{t.category}</span>
                      </TableCell>
                      <TableCell>{t.account || 'Principal'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {mentee
                          ? `Mentorado: ${mentee.name}`
                          : client
                            ? `Cliente: ${client.name}`
                            : '-'}
                      </TableCell>
                      <TableCell
                        className={
                          t.type === 'Receita'
                            ? 'text-green-600 font-semibold'
                            : 'text-red-600 font-semibold'
                        }
                      >
                        {t.type === 'Receita' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>{t.status}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Vincular Mentorado</Label>
                <Select
                  value={formData.mentee_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, mentee_id: v, client_id: 'none' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {mentees.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vincular Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, client_id: v, mentee_id: 'none' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSyncing}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
