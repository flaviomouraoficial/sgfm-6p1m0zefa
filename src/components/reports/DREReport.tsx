import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { FinancialMetrics } from '@/lib/financial'
import { formatCurrency, exportToCSV } from '@/lib/utils'

export function DREReport({ metrics }: { metrics: FinancialMetrics }) {
  const data = [
    {
      name: '(+) Receita Bruta de Vendas/Serviços',
      value: metrics.grossRevenue,
      isSubtotal: false,
    },
    { name: '(-) Impostos e Deduções', value: metrics.taxes, isSubtotal: false },
    { name: '(=) Receita Líquida', value: metrics.netRevenue, isSubtotal: true },
    { name: '(-) Custo dos Serviços Prestados (CPV/CSP)', value: metrics.cpv, isSubtotal: false },
    { name: '(=) Lucro Bruto', value: metrics.grossProfit, isSubtotal: true },
    { name: '(-) Despesas Operacionais', value: metrics.operatingExpenses, isSubtotal: false },
    { name: '(=) EBITDA (LAJIDA)', value: metrics.ebitda, isSubtotal: true },
    { name: '(-) Depreciação e Amortização', value: metrics.depreciation, isSubtotal: false },
    { name: '(-) Resultado Financeiro', value: metrics.financialResults, isSubtotal: false },
    { name: '(=) Lucro/Prejuízo do Período', value: metrics.netProfit, isSubtotal: true },
  ]

  const handleExport = () => {
    const csvData = data.map((d) => ({
      Rubrica: d.name,
      Valor: d.value,
    }))
    exportToCSV('DRE.csv', csvData)
  }

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle>DRE - Demonstrativo do Resultado do Exercício</CardTitle>
          <CardDescription>Estrutura contábil gerencial do período selecionado.</CardDescription>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm" className="shrink-0 bg-white">
          <Download className="w-4 h-4 mr-2" /> Exportar Relatório
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg">
        <Table>
          <TableBody>
            {data.map((d) => (
              <TableRow
                key={d.name}
                className={d.isSubtotal ? 'bg-muted/30 font-bold' : 'hover:bg-muted/10'}
              >
                <TableCell className={d.isSubtotal ? 'text-primary' : 'pl-8'}>{d.name}</TableCell>
                <TableCell className={`text-right ${d.isSubtotal ? 'text-primary' : ''}`}>
                  {d.isSubtotal || d.value === 0 ? '' : d.name.startsWith('(-)') ? '-' : '+'}{' '}
                  {formatCurrency(d.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
