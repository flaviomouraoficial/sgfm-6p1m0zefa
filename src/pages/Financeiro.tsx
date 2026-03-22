import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Transaction, TransactionType } from '@/lib/types'
import { formatCurrency, cn, exportToCSV } from '@/lib/utils'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { ImportModal } from '@/components/finance/ImportModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  MoreVertical,
  Edit,
  Search,
  DollarSign,
  RefreshCw,
  Upload,
  Download,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'

export default function Financeiro() {
  const { transactions, removeTransaction, removeTransactionGroup, isSyncing } = useMainStore()
  const [search, setSearch] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [formType, setFormType] = useState<TransactionType>('Receita')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    tx: Transaction | null
    mode: 'single' | 'future' | null
  }>({ open: false, tx: null, mode: null })

  const filteredTxs = useMemo(() => {
    let txs = [...transactions]
    if (search) {
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.client?.toLowerCase().includes(search.toLowerCase()) ||
          t.supplier?.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (filterPeriod !== 'all') {
      const now = new Date()
      txs = txs.filter((t) => {
        const d = new Date(t.date)
        if (filterPeriod === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }
        if (filterPeriod === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return d >= weekAgo && d <= now
        }
        if (filterPeriod === 'day') {
          return d.toDateString() === now.toDateString()
        }
        return true
      })
    }

    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, search, filterPeriod])

  const receitasPagas = filteredTxs
    .filter((t) => t.type === 'Receita' && t.status === 'Pago')
    .reduce((sum, t) => sum + t.amount, 0)
  const receitasPendentes = filteredTxs
    .filter((t) => t.type === 'Receita' && t.status === 'Pendente')
    .reduce((sum, t) => sum + t.amount, 0)
  const despesasPagas = filteredTxs
    .filter((t) => t.type === 'Despesa' && t.status === 'Pago')
    .reduce((sum, t) => sum + t.amount, 0)
  const despesasPendentes = filteredTxs
    .filter((t) => t.type === 'Despesa' && t.status === 'Pendente')
    .reduce((sum, t) => sum + t.amount, 0)

  const saldoRealizado = receitasPagas - despesasPagas
  const saldoProjetado = receitasPagas + receitasPendentes - (despesasPagas + despesasPendentes)

  const openNewForm = (type: TransactionType) => {
    setFormType(type)
    setEditingTx(null)
    setFormOpen(true)
  }

  const openEditForm = (tx: Transaction) => {
    setFormType(tx.type)
    setEditingTx(tx)
    setFormOpen(true)
  }

  const handleDeleteClick = (tx: Transaction) => {
    if (tx.recurringGroupId) {
      setDeleteDialog({ open: true, tx, mode: null })
    } else {
      setDeleteDialog({ open: true, tx, mode: 'single' })
    }
  }

  const confirmDelete = async (mode: 'single' | 'future') => {
    if (!deleteDialog.tx) return
    const tx = deleteDialog.tx
    try {
      if (mode === 'future' && tx.recurringGroupId) {
        await removeTransactionGroup(tx.recurringGroupId, tx.date)
      } else {
        await removeTransaction(tx.id)
      }
      toast({ title: 'Excluído', description: 'Transação removida com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao excluir transação.', variant: 'destructive' })
    }
    setDeleteDialog({ open: false, tx: null, mode: null })
  }

  const handleExport = () => {
    const data = filteredTxs.map((t) => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR'),
      Descrição: t.description,
      Categoria:
        t.classification || (t.type === 'Receita' ? 'Receita de Venda' : 'Despesa Operacional'),
      Subcategoria: t.category || t.service || '',
      Status: t.status,
      Valor: t.amount,
      Tipo: t.type,
      Cliente_Fornecedor: t.client || t.supplier || '',
    }))
    exportToCSV('financeiro.csv', data)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent tracking-tight">Painel Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de receitas, despesas e fluxo de caixa em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="bg-white flex-1 md:flex-none shadow-sm"
          >
            <Upload className="w-4 h-4 mr-2" /> Importar
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="bg-white flex-1 md:flex-none shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <Button
            onClick={() => openNewForm('Receita')}
            className="bg-primary hover:bg-primary/90 flex-1 md:flex-none shadow-md text-primary-foreground"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Nova Receita
          </Button>
          <Button
            onClick={() => openNewForm('Despesa')}
            className="bg-secondary hover:bg-secondary/90 flex-1 md:flex-none shadow-md text-secondary-foreground"
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Nova Despesa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <ArrowUpCircle className="mr-2 h-4 w-4 text-primary" /> Recebimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(receitasPagas)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              + {formatCurrency(receitasPendentes)} a receber
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-secondary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <ArrowDownCircle className="mr-2 h-4 w-4 text-secondary" /> Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(despesasPagas)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              + {formatCurrency(despesasPendentes)} a pagar
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-accent hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <DollarSign className="mr-2 h-4 w-4 text-accent" /> Saldo Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                saldoRealizado >= 0 ? 'text-accent' : 'text-destructive',
              )}
            >
              {formatCurrency(saldoRealizado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conta consolidada</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-muted hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" /> Saldo Projetado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                saldoProjetado >= 0 ? 'text-muted-foreground' : 'text-destructive',
              )}
            >
              {formatCurrency(saldoProjetado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Inclui pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            className="pl-8 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="day">Hoje</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm border-border/60">
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Subcategoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTxs.map((t) => {
                  const classification =
                    t.classification ||
                    (t.type === 'Receita' ? 'Receita de Venda' : 'Despesa Operacional')

                  return (
                    <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{t.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.client || t.supplier}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium text-[10px] uppercase tracking-wider',
                            classification === 'Receita de Venda'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : classification === 'Investimento'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-secondary/10 text-secondary border-secondary/20',
                          )}
                        >
                          {classification}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {t.category || t.service || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'font-medium text-xs',
                            t.status === 'Pago'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200',
                          )}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-bold',
                          t.type === 'Receita' ? 'text-primary' : 'text-secondary',
                        )}
                      >
                        {t.type === 'Receita' ? '+' : '-'} {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditForm(t)}>
                              <Edit className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(t)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultType={formType}
        transactionToEdit={editingTx}
      />

      <ImportModal open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(o) => setDeleteDialog({ ...deleteDialog, open: o })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.tx?.recurringGroupId && !deleteDialog.mode
                ? 'Esta transação faz parte de uma série recorrente. O que você deseja excluir?'
                : 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {deleteDialog.tx?.recurringGroupId && !deleteDialog.mode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => confirmDelete('single')}
                  disabled={isSyncing}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  {isSyncing && <RefreshCw className="w-3 h-3 mr-2 animate-spin" />} Apenas esta
                  parcela
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => confirmDelete('future')}
                  disabled={isSyncing}
                >
                  {isSyncing && <RefreshCw className="w-3 h-3 mr-2 animate-spin" />} Esta e as
                  futuras
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                onClick={() => confirmDelete('single')}
                disabled={isSyncing}
              >
                {isSyncing && <RefreshCw className="w-3 h-3 mr-2 animate-spin" />} Excluir
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
