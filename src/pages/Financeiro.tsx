import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { exportToCSV } from '@/lib/utils'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Download, Printer, UploadCloud } from 'lucide-react'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { ImportModal } from '@/components/finance/ImportModal'

export default function Financeiro() {
  const { company, transactions, services } = useMainStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filterType, setFilterType] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterService, setFilterService] = useState('Todos')

  const filtered = useMemo(() => {
    let res = company === 'Todas' ? transactions : transactions.filter((t) => t.company === company)
    if (filterType !== 'Todos') res = res.filter((t) => t.type === filterType)
    if (filterStatus !== 'Todos') res = res.filter((t) => t.status === filterStatus)
    if (filterService !== 'Todos') res = res.filter((t) => t.service === filterService)
    return res.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions, company, filterType, filterStatus, filterService])

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar/Receber</h1>
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
            <UploadCloud className="w-4 h-4 mr-2" /> Importar Dados
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="h-9 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Transação
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="bg-muted/30 rounded-t-lg border-b p-4 flex flex-row flex-wrap items-center gap-4 space-y-0 print:hidden">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas Categorias</SelectItem>
              <SelectItem value="Receita">Receitas</SelectItem>
              <SelectItem value="Despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos Status</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
              <SelectValue placeholder="Serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos Serviços</SelectItem>
              {services.map((s) => (
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
              <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableHead className="w-[90px]">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Empresa / Banco</TableHead>
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
                          Executado por: {t.performer}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{t.service}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{t.company}</span>
                        <span className="text-[10px] text-muted-foreground">{t.bank}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === 'Pago' ? 'secondary' : 'outline'}
                        className="font-normal text-[10px] px-2 py-0 h-5"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        t.type === 'Receita' ? 'text-green-600' : 'text-destructive'
                      }`}
                    >
                      {t.type === 'Receita' ? '+' : '-'} R${' '}
                      {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionForm open={modalOpen} onOpenChange={setModalOpen} />
      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
    </div>
  )
}
