import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { exportToCSV } from '@/lib/utils'
import { TransactionType } from '@/lib/types'
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
import { Plus, Download, Printer, UploadCloud, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { ImportModal } from '@/components/finance/ImportModal'

export default function Financeiro() {
  const { company, transactions, services, expenseCategories } = useMainStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TransactionType>('Receita')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterCategory, setFilterCategory] = useState('Todos')

  const isReceita = activeTab === 'Receita'

  const filtered = useMemo(() => {
    let res = transactions.filter((t) => t.type === activeTab)
    if (company !== 'Todas') res = res.filter((t) => t.company === company)
    if (filterStatus !== 'Todos') res = res.filter((t) => t.status === filterStatus)
    if (filterCategory !== 'Todos') {
      res = res.filter((t) =>
        isReceita ? t.service === filterCategory : t.category === filterCategory,
      )
    }
    return res.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions, activeTab, company, filterStatus, filterCategory, isReceita])

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestão Financeira</h1>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV('financeiro.csv', filtered)}
            className="h-9"
          >
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
            onClick={() => setModalOpen(true)}
            size="sm"
            className="h-9 bg-accent text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Transação
          </Button>
        </div>
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
                  <TableHead className="w-[90px]">Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>{isReceita ? 'Cliente / Mentorado' : 'Fornecedor'}</TableHead>
                  <TableHead>{isReceita ? 'Serviço' : 'Categoria'}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground/90">{t.description}</span>
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
                          className="font-normal text-[10px] px-2 py-0 h-5"
                        >
                          {t.status === 'Pago' ? (isReceita ? 'Recebido' : 'Pago') : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${isReceita ? 'text-green-600' : 'text-destructive'}`}
                      >
                        {isReceita ? '+' : '-'} R${' '}
                        {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      <TransactionForm open={modalOpen} onOpenChange={setModalOpen} defaultType={activeTab} />
      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
    </div>
  )
}
