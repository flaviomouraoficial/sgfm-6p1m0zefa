import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, exportToCSV } from '@/lib/utils'
import { Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function FechamentoTab() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [month, setMonth] = useState('')

  const loadReports = async () => {
    try {
      const res = await pb.collection('v1_reports').getFullList({ sort: '-month' })
      setReports(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const triggerClosing = async () => {
    if (!month) {
      toast({ title: 'Erro', description: 'Informe o mês (YYYY-MM)', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await pb.send('/backend/v1/reports/closing', {
        method: 'POST',
        body: JSON.stringify({ month }),
      })
      toast({ title: 'Sucesso', description: 'Fechamento gerado com sucesso.' })
      setMonth('')
      await loadReports()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao gerar fechamento.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (report: any) => {
    exportToCSV(`fechamento_${report.month}.csv`, [
      {
        Mês: report.month,
        Receitas: report.totalRevenue,
        Despesas: report.totalExpenses,
        Saldo: report.netBalance,
      },
    ])
    toast({ title: 'Sucesso', description: 'Relatório exportado (Formato de dados estruturado).' })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Fechamento Manual</CardTitle>
          <CardDescription>
            Gere o consolidado de um mês específico no formato YYYY-MM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês de Fechamento</label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <Button onClick={triggerClosing} disabled={loading || !month}>
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Fechamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Saldo Líquido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.month}</TableCell>
                  <TableCell className="text-right text-primary font-medium">
                    {formatCurrency(r.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    {formatCurrency(r.totalExpenses)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${r.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(r.netBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => exportReport(r)}>
                      <Download className="w-4 h-4 mr-2" /> Exportar Dados
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum fechamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
