import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Transaction, TransactionType } from '@/lib/types'
import { formatCurrency, cn } from '@/lib/utils'
import { TransactionForm } from '@/components/finance/TransactionForm'
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

export default function Financeiro() {
  const { transactions, removeTransaction, removeTransactionGroup } = useMainStore()
  const [search, setSearch] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
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

  const totalReceitas = filteredTxs
    .filter((t) => t.type === 'Receita')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalDespesas = filteredTxs
    .filter((t) => t.type === 'Despesa')
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = totalReceitas - totalDespesas

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
    if (mode === 'future' && tx.recurringGroupId) {
      await removeTransactionGroup(tx.recurringGroupId, tx.date)
    } else {
      await removeTransaction(tx.id)
    }
    setDeleteDialog({ open: false, tx: null, mode: null })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent tracking-tight">Painel Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de receitas, despesas e fluxo de caixa.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => openNewForm('Receita')}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto shadow-md text-primary-foreground"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Nova Receita
          </Button>
          <Button
            onClick={() => openNewForm('Despesa')}
            className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto shadow-md text-secondary-foreground"
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Nova Despesa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <ArrowUpCircle className="mr-2 h-4 w-4 text-primary" /> Total de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalReceitas)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-secondary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <ArrowDownCircle className="mr-2 h-4 w-4 text-secondary" /> Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(totalDespesas)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-accent hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <DollarSign className="mr-2 h-4 w-4 text-accent" /> Saldo Consolidado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                balance >= 0 ? 'text-accent' : 'text-destructive',
              )}
            >
              {formatCurrency(balance)}
            </div>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTxs.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{t.description}</div>
                      <div className="text-xs text-muted-foreground">{t.client || t.supplier}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs bg-background">
                        {t.category || t.service}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'font-medium',
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
                ))
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
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  Apenas esta parcela
                </Button>
                <Button variant="destructive" onClick={() => confirmDelete('future')}>
                  Esta e as futuras
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={() => confirmDelete('single')}>
                Excluir
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
