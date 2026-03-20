import { useMemo, useState, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { cn, exportToCSV, formatCurrency } from '@/lib/utils'
import { Transaction, TransactionType, Attachment } from '@/lib/types'
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
import { Button, buttonVariants } from '@/components/ui/button'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { toast } from '@/hooks/use-toast'
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
  AlertCircle,
  AlertTriangle,
  MessageCircle,
  Mail,
  CheckCircle2,
  FileText,
  Paperclip,
  RefreshCw,
  CalendarPlus,
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
import { GoalCard } from '@/components/dashboard/GoalCard'
import { ReportPDF } from '@/components/finance/ReportPDF'
import { AttachmentsModal } from '@/components/finance/AttachmentsModal'

export default function Financeiro() {
  const {
    company,
    transactions,
    services,
    expenseCategories,
    clients,
    removeTransaction,
    updateTransaction,
    revenueGoal,
    setRevenueGoal,
  } = useMainStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TransactionType>('Receita')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterCategory, setFilterCategory] = useState('Todos')
  const [period, setPeriod] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)

  const [printMode, setPrintMode] = useState<'table' | 'report' | null>(null)

  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false)
  const [attachmentsToView, setAttachmentsToView] = useState<Attachment[]>([])

  const isReceita = activeTab === 'Receita'

  const currentMonthRevenue = useMemo(() => {
    const now = new Date()
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    let txs = transactions || []
    if (company !== 'Todas') txs = txs.filter((t) => t.company === company)
    return txs
      .filter(
        (t) =>
          t.type === 'Receita' &&
          t.status === 'Pago' &&
          (t.date || '').startsWith(currentMonthPrefix),
      )
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  }, [transactions, company])

  const baseFiltered = useMemo(() => {
    let res = transactions || []
    if (company !== 'Todas') res = res.filter((t) => t.company === company)

    if (period !== 'all') {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      let start = new Date(now)
      let end = new Date(now)

      if (period === 'currentMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      } else if (period === 'last3Months') {
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      } else if (period === 'currentYear') {
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      } else if (period === 'custom') {
        if (dateRange?.from) {
          start = new Date(dateRange.from)
          start.setHours(0, 0, 0, 0)
          end = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from)
          end.setHours(23, 59, 59, 999)
        } else {
          start = new Date(0)
          end = new Date(8640000000000000)
        }
      }

      res = res.filter((t) => {
        if (!t.date) return false
        const d = new Date(t.date)
        if (isNaN(d.getTime())) return false
        return d >= start && d <= end
      })
    }
    return res
  }, [transactions, company, period, dateRange])

  const receitasTotais = useMemo(
    () =>
      baseFiltered
        .filter((t) => t.type === 'Receita' && t.status === 'Pago')
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0),
    [baseFiltered],
  )
  const despesasTotais = useMemo(
    () =>
      baseFiltered
        .filter((t) => t.type === 'Despesa' && t.status === 'Pago')
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0),
    [baseFiltered],
  )
  const saldoLiquido = receitasTotais - despesasTotais

  const pendentesReceber = useMemo(() => {
    return baseFiltered
      .filter((t) => t.type === 'Receita' && t.status === 'Pendente')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
  }, [baseFiltered])

  const pendentesPagar = useMemo(() => {
    return baseFiltered
      .filter((t) => t.type === 'Despesa' && t.status === 'Pendente')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
  }, [baseFiltered])

  const tabFiltered = useMemo(() => {
    let res = baseFiltered.filter((t) => t.type === activeTab)
    if (filterStatus !== 'Todos') res = res.filter((t) => t.status === filterStatus)
    if (filterCategory !== 'Todos') {
      res = res.filter((t) =>
        isReceita ? t.service === filterCategory : t.category === filterCategory,
      )
    }
    return res.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
  }, [baseFiltered, activeTab, filterStatus, filterCategory, isReceita])

  const getReminderStatus = (t: Transaction): 'overdue' | 'warning' | null => {
    if (t.status === 'Pago' || !t.date) return null
    const d = new Date(t.date)
    if (isNaN(d.getTime())) return null

    d.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffTime = d.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays >= 0 && diffDays <= 3) return 'warning'
    return null
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
      toast({
        title: 'Lançamento Removido',
        description: 'A transação foi excluída com sucesso.',
      })
    }
  }

  const handleExportCSV = () => {
    const dataToExport = tabFiltered.map((t) => {
      const exp: any = {
        Descrição: t.description,
        Valor: Number(t.amount) || 0,
        Categoria: isReceita ? t.service : t.category,
        Status: t.status === 'Pago' ? (isReceita ? 'Recebido' : 'Pago') : 'Pendente',
        Vencimento: t.date ? new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
        [isReceita ? 'Cliente/Mentorado' : 'Fornecedor']: isReceita ? t.client : t.supplier,
      }
      if (isReceita) exp['Link Pgto'] = t.paymentLink || '-'
      return exp
    })
    exportToCSV(`financeiro_${activeTab.toLowerCase()}.csv`, dataToExport)
  }

  const handleSyncCalendar = () => {
    const pendingReceitas = tabFiltered.filter(
      (t) => t.type === 'Receita' && t.status === 'Pendente' && t.date,
    )
    if (pendingReceitas.length === 0) {
      toast({
        title: 'Nenhuma pendência',
        description: 'Não há contas a receber pendentes no filtro atual para sincronizar.',
      })
      return
    }

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Flavio Moura//Financeiro//PT\n'

    pendingReceitas.forEach((t) => {
      if (!t.date) return
      const date = new Date(t.date)
      if (isNaN(date.getTime())) return

      const dateStr = date
        .toISOString()
        .replace(/-|:|\.\d\d\d/g, '')
        .substring(0, 8)
      icsContent += 'BEGIN:VEVENT\n'
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`
      icsContent += `DTEND;VALUE=DATE:${dateStr}\n`
      icsContent += `SUMMARY:Recebimento Pendente: ${t.description} - ${t.client || ''}\n`
      icsContent += `DESCRIPTION:Valor: R$ ${t.amount}\\nStatus: ${t.status}\n`
      icsContent += 'END:VEVENT\n'
    })

    icsContent += 'END:VCALENDAR'

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'recebimentos_pendentes.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({ title: 'Agenda Sincronizada', description: 'Arquivo ICS gerado com sucesso.' })
  }

  const handleQuickReceipt = (t: Transaction) => {
    updateTransaction(t.id, {
      status: 'Pago',
      updatedAt: new Date().toISOString(),
    })
    toast({
      title: 'Baixa Automática Realizada',
      description: `A transação "${t.description}" foi marcada como ${t.type === 'Receita' ? 'Recebida' : 'Paga'}.`,
    })
  }

  useEffect(() => {
    const afterPrint = () => setPrintMode(null)
    window.addEventListener('afterprint', afterPrint)
    return () => window.removeEventListener('afterprint', afterPrint)
  }, [])

  const handlePrintReport = () => {
    setPrintMode('report')
    setTimeout(() => {
      window.print()
    }, 300)
  }

  const periodLabel =
    period === 'all'
      ? 'Todo o período'
      : period === 'currentMonth'
        ? 'Mês Atual'
        : period === 'last3Months'
          ? 'Últimos 3 Meses'
          : period === 'currentYear'
            ? 'Ano Atual'
            : 'Personalizado'

  return (
    <div className="w-full relative">
      <div
        className={cn('space-y-6 animate-slide-up', printMode === 'report' ? 'print:hidden' : '')}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Controle Financeiro</h1>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReport}
              className="h-9 font-medium text-primary hover:text-primary"
            >
              <FileText className="w-4 h-4 mr-2" /> Relatório PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9">
              <Download className="w-4 h-4 mr-2" /> Exportar Planilha
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncCalendar}
              className="h-9 text-blue-600 hover:text-blue-700"
            >
              <CalendarPlus className="w-4 h-4 mr-2" /> Sync com Agenda (ICS)
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <StatCard
            title="Saldo Atual (Filtro)"
            value={formatCurrency(saldoLiquido)}
            icon={<Wallet className="w-6 h-6" />}
            isPositive={saldoLiquido >= 0}
          />
          <StatCard
            title="A Receber (Pendente)"
            value={formatCurrency(pendentesReceber)}
            icon={<TrendingUp className="w-6 h-6" />}
            isPositive={true}
          />
          <StatCard
            title="A Pagar (Pendente)"
            value={formatCurrency(pendentesPagar)}
            icon={<TrendingDown className="w-6 h-6" />}
            isPositive={false}
          />
          <GoalCard
            current={currentMonthRevenue}
            goal={revenueGoal || 20000}
            onUpdateGoal={setRevenueGoal}
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TransactionType)
            setFilterCategory('Todos')
          }}
        >
          <TabsList className="mb-4 bg-muted/50 p-1 w-full sm:w-auto h-auto flex flex-wrap sm:flex-nowrap">
            <TabsTrigger
              value="Receita"
              className="flex-1 sm:flex-none items-center gap-2 data-[state=active]:text-green-600 data-[state=active]:bg-background py-2"
            >
              <ArrowUpCircle className="w-4 h-4" /> Contas a Receber
            </TabsTrigger>
            <TabsTrigger
              value="Despesa"
              className="flex-1 sm:flex-none items-center gap-2 data-[state=active]:text-destructive data-[state=active]:bg-background py-2"
            >
              <ArrowDownCircle className="w-4 h-4" /> Contas a Pagar
            </TabsTrigger>
          </TabsList>

          <Card className="shadow-sm border-none">
            <CardHeader className="bg-muted/30 rounded-t-lg border-b p-4 flex flex-row flex-wrap items-center gap-4 space-y-0 print:hidden">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px] h-9 text-sm bg-background">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currentMonth">Mês Atual</SelectItem>
                  <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="currentYear">Ano Atual</SelectItem>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="custom">Personalizado...</SelectItem>
                </SelectContent>
              </Select>

              {period === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-9 text-sm justify-start text-left font-normal bg-background',
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
                <SelectTrigger className="w-[150px] h-9 text-sm bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Status</SelectItem>
                  <SelectItem value="Pago">{isReceita ? 'Recebido' : 'Pago'}</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px] h-9 text-sm bg-background">
                  <SelectValue placeholder={isReceita ? 'Serviço' : 'Categoria'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas(os)</SelectItem>
                  {(isReceita ? services : expenseCategories).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead className="w-[100px]">Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>{isReceita ? 'Cliente / Mentorado' : 'Fornecedor'}</TableHead>
                    <TableHead>{isReceita ? 'Serviço' : 'Categoria'}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    {isReceita && <TableHead className="w-[60px] text-center">Link</TableHead>}
                    <TableHead className="w-[140px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isReceita ? 8 : 7}
                        className="text-center py-10 text-muted-foreground"
                      >
                        Nenhuma transação encontrada com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tabFiltered.map((t) => {
                      const reminder = getReminderStatus(t)
                      const isOverdue = reminder === 'overdue'

                      let waLink = ''
                      let emailLink = ''
                      if (isReceita && isOverdue && t.client) {
                        const clientInfo = clients.find((c) => c.name === t.client)
                        const phone = clientInfo?.phone || '5511999999999'
                        const email = clientInfo?.email || 'contato@cliente.com'
                        const waMsg = `Olá ${t.client}, notamos que o pagamento de ${formatCurrency(Number(t.amount) || 0)} referente a ${t.description} ainda não foi identificado. Poderia nos enviar o comprovante?`
                        waLink = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
                        const emailSubject = `Lembrete de Pagamento: ${t.description}`
                        emailLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(waMsg)}`
                      }

                      return (
                        <TableRow
                          key={t.id}
                          className={cn(
                            'transition-colors',
                            reminder === 'overdue' && 'bg-destructive/10 hover:bg-destructive/15',
                            reminder === 'warning' && 'bg-yellow-500/10 hover:bg-yellow-500/15',
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'font-medium',
                                  reminder === 'overdue' && 'text-destructive',
                                  reminder === 'warning' && 'text-yellow-600',
                                )}
                              >
                                {t.date
                                  ? new Date(t.date).toLocaleDateString('pt-BR', {
                                      timeZone: 'UTC',
                                    })
                                  : '-'}
                              </span>
                              {reminder === 'overdue' && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                  </TooltipTrigger>
                                  <TooltipContent>Pagamento Atrasado</TooltipContent>
                                </Tooltip>
                              )}
                              {reminder === 'warning' && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>Vence em breve (até 3 dias)</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground/90 leading-tight">
                                  {t.description}
                                </span>
                                {t.attachments && t.attachments.length > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        className="text-muted-foreground hover:text-primary transition-colors flex items-center bg-muted/50 rounded p-0.5"
                                        onClick={() => {
                                          setAttachmentsToView(t.attachments || [])
                                          setAttachmentsModalOpen(true)
                                        }}
                                      >
                                        <Paperclip className="w-3.5 h-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ver Documentos Anexados</TooltipContent>
                                  </Tooltip>
                                )}
                                {t.recurrence && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <RefreshCw className="w-3 h-3 text-muted-foreground ml-0.5" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Recorrente: Parcela {t.recurrence.current} de{' '}
                                      {t.recurrence.total}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
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
                                'font-medium text-[11px] px-2.5 py-0.5',
                                reminder === 'overdue' && 'border-destructive text-destructive',
                                reminder === 'warning' && 'border-yellow-600 text-yellow-600',
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
                            {isReceita ? '+' : '-'} {formatCurrency(Number(t.amount) || 0)}
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {t.status === 'Pendente' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => handleQuickReceipt(t)}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Baixa Automática ({isReceita ? 'Recebido' : 'Pago'})
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {isReceita && isOverdue && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a
                                        href={waLink || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={cn(
                                          buttonVariants({ variant: 'ghost', size: 'icon' }),
                                          'h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50',
                                        )}
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>Cobrar via WhatsApp</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a
                                        href={emailLink || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={cn(
                                          buttonVariants({ variant: 'ghost', size: 'icon' }),
                                          'h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50',
                                        )}
                                      >
                                        <Mail className="w-4 h-4" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>Cobrar via Email</TooltipContent>
                                  </Tooltip>
                                </>
                              )}

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
                            </div>
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
      </div>

      {printMode === 'report' && (
        <ReportPDF
          data={baseFiltered}
          company={company}
          periodLabel={periodLabel}
          receitas={receitasTotais}
          despesas={despesasTotais}
          saldo={saldoLiquido}
        />
      )}

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

      <AttachmentsModal
        open={attachmentsModalOpen}
        onOpenChange={setAttachmentsModalOpen}
        attachments={attachmentsToView}
      />

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
