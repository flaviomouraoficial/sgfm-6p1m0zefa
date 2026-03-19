import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { TransactionForm } from '@/components/finance/TransactionForm'

export default function Financeiro() {
  const { company, transactions } = useMainStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterType, setFilterType] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')

  const filtered = useMemo(() => {
    let res = company === 'Todas' ? transactions : transactions.filter((t) => t.company === company)
    if (filterType !== 'Todos') res = res.filter((t) => t.type === filterType)
    if (filterStatus !== 'Todos') res = res.filter((t) => t.status === filterStatus)
    return res.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions, company, filterType, filterStatus])

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar/Receber</h1>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Transação
        </Button>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="bg-muted/50 rounded-t-lg border-b p-4 flex flex-row items-center gap-4 space-y-0">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas as Categorias</SelectItem>
                <SelectItem value="Receita">Receitas</SelectItem>
                <SelectItem value="Despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
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
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.type === 'Receita' ? 'default' : 'destructive'}
                        className="font-normal"
                      >
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{t.company}</span>
                        <span className="text-xs text-muted-foreground">{t.bank}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === 'Pago' ? 'secondary' : 'outline'}
                        className="font-normal"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${t.type === 'Receita' ? 'text-green-600' : 'text-destructive'}`}
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
    </div>
  )
}
