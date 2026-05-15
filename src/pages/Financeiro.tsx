import { useState, useMemo, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { useFinanceStore } from '@/stores/finance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Plus, RefreshCw, Trash2, Edit, CheckCircle2, Wallet, Printer } from 'lucide-react'
import { formatCurrency, exportToCSV } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { ContaFinanceira } from '@/lib/types'

export default function Financeiro() {
  const {
    transactions,
    mentees,
    clients,
    updateTransaction,
    removeTransaction,
    isSyncing,
    syncData,
  } = useMainStore()

  const { contas, fetchContas, addConta, updateConta, deleteConta } = useFinanceStore()

  useEffect(() => {
    fetchContas()
  }, [])

  const [isAddingTx, setIsAddingTx] = useState(false)
  const [editingTx, setEditingTx] = useState<any>(null)

  const [isContaDialog, setIsContaDialog] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null)
  const [contaFormData, setContaFormData] = useState<Partial<ContaFinanceira>>({
    nome: '',
    tipo: 'Corrente',
    saldo_inicial: 0,
  })

  const [filterType, setFilterType] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterConta, setFilterConta] = useState('Todas')

  const balances = useMemo(() => {
    const bal: Record<string, number> = {}
    contas.forEach((c) => {
      bal[c.id] = c.saldo_inicial || 0
    })

    transactions.forEach((t: any) => {
      if (t.status === 'Pago' && t.conta_id && bal[t.conta_id] !== undefined) {
        if (t.type === 'Receita') bal[t.conta_id] += t.amount
        else bal[t.conta_id] -= t.amount
      }
    })
    return bal
  }, [transactions, contas])

  const filteredTxs = useMemo(() => {
    let res = transactions
    if (filterType !== 'Todos') res = res.filter((t) => t.type === filterType)
    if (filterStatus !== 'Todos') res = res.filter((t) => t.status === filterStatus)
    if (filterConta !== 'Todas') res = res.filter((t: any) => t.conta_id === filterConta)
    return res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, filterType, filterStatus, filterConta])

  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingConta) {
        await updateConta(editingConta.id, contaFormData)
        toast({ title: 'Sucesso', description: 'Conta atualizada.' })
      } else {
        await addConta(contaFormData)
        toast({ title: 'Sucesso', description: 'Conta registrada.' })
      }
      setIsContaDialog(false)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar conta.', variant: 'destructive' })
    }
  }

  const handleDeleteConta = async (id: string) => {
    if (
      confirm(
        'Atenção: Excluir esta conta pode causar inconsistências em transações vinculadas. Continuar?',
      )
    ) {
      try {
        await deleteConta(id)
        toast({ title: 'Sucesso', description: 'Conta removida.' })
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' })
      }
    }
  }

  const handleDeleteTx = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await removeTransaction(id)
        toast({ title: 'Sucesso', description: 'Transação removida.' })
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' })
      }
    }
  }

  const toggleConciliacao = async (tx: any) => {
    try {
      await updateTransaction(tx.id, { conciliado: !tx.conciliado })
      toast({
        title: 'Sucesso',
        description: tx.conciliado ? 'Conciliação removida.' : 'Transação conciliada com sucesso.',
      })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao conciliar transação.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent">Governança Financeira</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de contas, saldos e conciliação bancária.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="bg-white">
            <Printer className="w-4 h-4 mr-2" /> Imprimir Extrato
          </Button>
          <Button
            onClick={() => {
              setEditingTx(null)
              setIsAddingTx(true)
            }}
            className="bg-primary hover:bg-secondary"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Transação
          </Button>
        </div>
      </div>

      <div className="print:block hidden mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Extrato Consolidado</h1>
        <p className="text-gray-500">Data de emissão: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {contas.map((conta) => (
          <Card key={conta.id} className="shadow-sm border-l-4 border-l-primary relative group">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1 print:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setEditingConta(conta)
                  setContaFormData(conta)
                  setIsContaDialog(true)
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => handleDeleteConta(conta.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" /> {conta.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(balances[conta.id] || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Saldo Inicial: {formatCurrency(conta.saldo_inicial || 0)}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card
          className="shadow-sm border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors print:hidden"
          onClick={() => {
            setEditingConta(null)
            setContaFormData({ nome: '', tipo: 'Corrente', saldo_inicial: 0 })
            setIsContaDialog(true)
          }}
        >
          <div className="text-center p-4">
            <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Nova Conta</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 print:hidden">
          <div>
            <CardTitle>Extrato e Conciliação</CardTitle>
            <CardDescription>
              Verifique os lançamentos e faça a conciliação bancária.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
            <Select value={filterConta} onValueChange={setFilterConta}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas Contas</SelectItem>
                {contas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos Tipos</SelectItem>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos Status</SelectItem>
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
                <TableHead className="w-12 text-center print:hidden">Concil</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right print:hidden">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTxs.map((t: any) => {
                  const conta = contas.find((c) => c.id === t.conta_id)
                  const mentee = mentees.find((m) => m.id === t.mentee_id)
                  const client = clients.find((c) => c.id === t.client_id)

                  return (
                    <TableRow key={t.id} className={t.conciliado ? 'bg-muted/10' : ''}>
                      <TableCell className="text-center print:hidden">
                        <Checkbox
                          checked={t.conciliado}
                          onCheckedChange={() => toggleConciliacao(t)}
                          disabled={t.status !== 'Pago'}
                          title={
                            t.status !== 'Pago'
                              ? 'Apenas transações pagas podem ser conciliadas'
                              : 'Marcar como conciliado'
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {t.description}
                        <br />
                        <span className="text-[10px] text-muted-foreground">{t.category}</span>
                      </TableCell>
                      <TableCell className="text-xs">{conta?.nome || 'Não Vinculada'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {mentee
                          ? `Mentorado: ${mentee.name}`
                          : client
                            ? `Cliente: ${client.name}`
                            : '-'}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm ${t.type === 'Receita' ? 'text-primary font-bold' : 'text-destructive font-semibold'}`}
                      >
                        {t.type === 'Receita' ? '+' : '-'} {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={t.status === 'Pago' ? 'default' : 'outline'}
                          className="text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTx(t)
                            setIsAddingTx(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteTx(t.id)}
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

      <Dialog open={isContaDialog} onOpenChange={setIsContaDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingConta ? 'Editar Conta' : 'Nova Conta Financeira'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveConta} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome da Instituição/Conta</Label>
              <Input
                required
                value={contaFormData.nome}
                onChange={(e) => setContaFormData({ ...contaFormData, nome: e.target.value })}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={contaFormData.tipo}
                  onValueChange={(v: any) => setContaFormData({ ...contaFormData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrente">Corrente</SelectItem>
                    <SelectItem value="Poupança">Poupança</SelectItem>
                    <SelectItem value="Investimento">Investimento</SelectItem>
                    <SelectItem value="Caixa">Caixa Físico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Saldo Inicial (R$)</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={contaFormData.saldo_inicial}
                  onChange={(e) =>
                    setContaFormData({ ...contaFormData, saldo_inicial: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsContaDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Conta</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isAddingTx && (
        <TransactionForm
          open={isAddingTx}
          onOpenChange={setIsAddingTx}
          defaultType="Receita"
          transactionToEdit={editingTx}
        />
      )}
    </div>
  )
}
