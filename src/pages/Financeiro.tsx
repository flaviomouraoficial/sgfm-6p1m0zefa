import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { cn, exportToCSV, formatCurrency } from '@/lib/utils'
import { Transaction, TransactionType } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import {
  Plus,
  Download,
  Printer,
  UploadCloud,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { ImportModal } from '@/components/finance/ImportModal'
import { StatCard } from '@/components/dashboard/StatCard'

export default function Financeiro() {
  const { company, transactions, services, expenseCategories, removeTransaction } = useMainStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TransactionType>('Receita')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterCategory, setFilterCategory] = useState('Todos')
  const [period, setPeriod] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)

  const isReceita = activeTab === 'Receita'

  const baseFiltered = useMemo(() => {
    let res = transactions
    if (company !== 'Todas') res = res.filter((t) => t.company === company)

    if (period !== 'all') {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      let start = new Date(now)
      let end = new Date(now)

      if (period === '7days') end.setDate(end.getDate() + 7)
      else if (period === '15days') end.setDate(end.getDate() + 15)
      else if (period === '30days') end.setDate(end.getDate() + 30)

      if (period === 'custom') {
        if (dateRange?.from) {
          start = new Date(dateRange.from)
          start.setHours(0, 0, 0, 0)
          end = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from)
          end.setHours(23, 59, 59, 999)
        } else {
          start = new Date(0)
          end = new Date(8640000000000000)
        }
      } else {
        end.setHours(23, 59, 59, 999)
      }

      res = res.filter((t) => {
        const d = new Date(t.date)
        return d >= start && d <= end
      })
    }
    return res
  }, [transactions, company, period, dateRange])

  const saldo = useMemo(() => {
    const receitas = baseFiltered
      .filter((t) => t.type === 'Receita' && t.status === 'Pago')
      .reduce((acc, t) => acc + t.amount, 0)
    const despesas = baseFiltered
      .filter((t) => t.type === 'Despesa' && t.status === 'Pago')
      .reduce((acc, t) => acc + t.amount, 0)
    return receitas - despesas
  }, [baseFiltered])

  const pendentesReceber = useMemo(() => {
    return baseFiltered
      .filter((t) => t.type === 'Receita' && t.status === 'Pendente')
      .reduce((acc, t) => acc + t.amount, 0)
  }, [baseFiltered])

  const pendentesPagar = useMemo(() => {
    return baseFiltered
      .filter((t) => t.type === 'Despesa' && t.status === 'Pendente')
      .reduce((acc, t) => acc + t.amount, 0)
  }, [baseFiltered])

  const tabFiltered = useMemo(() => {
    let res = baseFiltered.filter((t) => t.type === activeTab)
    if (filterStatus !== 'Todos') res = res.filter((t) => t.status === filterStatus)
    if (filterCategory !== 'Todos') {
      res = res.filter((t) =>
        isReceita ? t.service === filterCategory : t.category === filterCategory,
      )
    }
    return res.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [baseFiltered, activeTab, filterStatus, filterCategory, isReceita])

  const isOverdue = (t: Transaction) => {
    const d = new Date(t.date)
    d.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return t.status === 'Pendente' && d < today
  }

  const handleEdit = (t: Transaction) => {
    setTransactionToEdit(t)
    setModalOpen(true)
  }

  const handleDeleteConfirm = (t: Transaction) => {
    setTransactionToDelete(t)
  }

  const confirmDelete = () => {
    if (transactionToDelete) {
      removeTransaction(transactionToDelete.id)
      setTransactionToDelete(null)
    }
  }

  const handleExportCSV = () => {
    const dataToExport = tabFiltered.map((t) => {
      const exp: any = {
        Descrição: t.description,
        Valor: t.amount,
        Categoria: isReceita ? t.service : t.category,
        Status: t.status === 'Pago' ? (isReceita ? 'Recebido' : 'Pago') : 'Pendente',
        Vencimento: new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        [isReceita ? 'Cliente/Mentorado' : 'Fornecedor']: isReceita ? t.client : t.supplier,
        'Última Alteração': t.updatedAt
          ? new Date(t.updatedAt).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : '-',
      }
      if (isReceita) {
        exp['Link Pgto'] = t.paymentLink || '-'
      }
      return exp
    })
    exportToCSV(`financeiro_${activeTab.toLowerCase()}.csv`, dataToExport)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestão Financeira</h1>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="h-9"
          >
            <UploadCloud className="w-4 h-4 mr-2" /> Importar Planilha
          </Button>
          <Button
            onClick={() => {
              setTransactionToEdit(null)
              setModalOpen(true)
            }}
            size="sm"
            className="h-9 bg-accent text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <StatCard
          title="Saldo Atual (Período)"
          value={formatCurrency(saldo)}
          icon={<Wallet className="w-6 h-6" />}
          isPositive={saldo >= 0}
        />
        <StatCard
          title="Total a Receber (Período)"
          value={formatCurrency(pendentesReceber)}
          icon={<TrendingUp className="w-6 h-6" />}
          isPositive={true}
        />
        <StatCard
          title="Total a Pagar (Período)"
          value={formatCurrency(pendentesPagar)}
          icon={<TrendingDown className="w-6 h-6" />}
          isPositive={false}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TransactionType)
          setFilterCategory('Todos')
        }}
      >
        <TabsList className="mb-4 bg-muted/50 p-1">
          <TabsTrigger
            value="Receita"
            className="flex items-center gap-2 data-[state=active]:text-green-600 data-[state=active]:bg-background"
          >
            <ArrowUpCircle className="w-4 h-4" /> Contas a Receber
          </TabsTrigger>
          <TabsTrigger
            value="Despesa"
            className="flex items-center gap-2 data-[state=active]:text-destructive data-[state=active]:bg-background"
          >
            <ArrowDownCircle className="w-4 h-4" /> Contas a Pagar
          </TabsTrigger>
        </TabsList>

        <Card className="shadow-sm border-none">
          <CardHeader className="bg-muted/30 rounded-t-lg border-b p-4 flex flex-row flex-wrap items-center gap-4 space-y-0 print:hidden">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="7days">Próximos 7 dias</SelectItem>
                <SelectItem value="15days">Próximos 15 dias</SelectItem>
                <SelectItem value="30days">Próximo mês (30 dias)</SelectItem>
                <SelectItem value="custom">Período específico</SelectItem>
              </SelectContent>
            </Select>

            {period === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-8 text-xs justify-start text-left font-normal bg-background',
                      !dateRange && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos Status</SelectItem>
                <SelectItem value="Pago">{isReceita ? 'Recebido' : 'Pago'}</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
                <SelectValue placeholder={isReceita ? 'Serviço' : 'Categoria'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos(as)</SelectItem>
                {(isReceita ? services : expenseCategories).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-[90px]">Lançamento</TableHead>
                  <TableHead className="w-[90px]">Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>{isReceita ? 'Cliente / Mentorado' : 'Fornecedor'}</TableHead>
                  <TableHead>{isReceita ? 'Serviço' : 'Categoria'}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {isReceita && <TableHead className="w-[60px] text-center">Link Pgto</TableHead>}
                  <TableHead className="w-[110px]">Última Alteração</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isReceita ? 10 : 9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhuma transação encontrada neste período.
                    </TableCell>
                  </TableRow>
                ) : (
                  tabFiltered.map((t) => {
                    const overdue = isOverdue(t)
                    return (
                      <TableRow
                        key={t.id}
                        className={cn(overdue && 'bg-destructive/5 hover:bg-destructive/10')}
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {t.entryDate
                            ? new Date(t.entryDate).toLocaleDateString('pt-BR', {
                                timeZone: 'UTC',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className={cn('font-medium', overdue && 'text-destructive')}>
                          {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground/90">
                              {t.description}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {t.paymentMethod}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{isReceita ? t.client : t.supplier}</TableCell>
                        <TableCell>{isReceita ? t.service : t.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={t.status === 'Pago' ? 'secondary' : 'outline'}
                            className={cn(
                              'font-normal text-[10px] px-2 py-0 h-5',
                              overdue && 'border-destructive text-destructive',
                            )}
                          >
                            {t.status === 'Pago' ? (isReceita ? 'Recebido' : 'Pago') : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-bold',
                            isReceita ? 'text-green-600' : 'text-destructive',
                          )}
                        >
                          {isReceita ? '+' : '-'} {formatCurrency(t.amount)}
                        </TableCell>
                        {isReceita && (
                          <TableCell className="text-center">
                            {t.paymentLink ? (
                              <a
                                href={t.paymentLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                                title="Abrir link de pagamento"
                              >
                                <ExternalLink className="w-4 h-4 mx-auto inline" />
                              </a>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {t.updatedAt
                            ? new Date(t.updatedAt).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(t)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteConfirm(t)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
      </Tabs>

      <TransactionForm
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v)
          if (!v) setTransactionToEdit(null)
        }}
        defaultType={activeTab}
        transactionToEdit={transactionToEdit}
      />
      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />

      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(o) => !o && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lançamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
