import { useMemo } from 'react'
import { Transaction } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { formatCurrency, exportToCSV } from '@/lib/utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { getMonthlyTrends } from '@/lib/financial'

export function CashFlowReport({
  transactions,
  allTransactions,
}: {
  transactions: Transaction[]
  allTransactions: Transaction[]
}) {
  const dailyData = useMemo(() => {
    const days: Record<string, { inflows: number; outflows: number }> = {}
    transactions.forEach((t) => {
      const d = t.date
      if (!days[d]) days[d] = { inflows: 0, outflows: 0 }
      if (t.type === 'Receita') days[d].inflows += t.amount
      else days[d].outflows += t.amount
    })
    let runningBalance = 0
    return Object.entries(days)
      .sort()
      .map(([date, vals]) => {
        const dailyBalance = vals.inflows - vals.outflows
        runningBalance += dailyBalance
        return {
          date,
          inflows: vals.inflows,
          outflows: vals.outflows,
          dailyBalance,
          runningBalance,
        }
      })
  }, [transactions])

  const chartData = useMemo(() => getMonthlyTrends(allTransactions, 12), [allTransactions])

  const handleExport = () => {
    const csvData = dailyData.map((d) => ({
      Data: new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      Entradas: d.inflows,
      Saidas: d.outflows,
      SaldoDoDia: d.dailyBalance,
      SaldoAcumulado: d.runningBalance,
    }))
    exportToCSV('Fluxo_de_Caixa.csv', csvData)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border/60">
        <CardHeader>
          <CardTitle>Evolução do Fluxo de Caixa (Últimos 12 Meses)</CardTitle>
          <CardDescription>Visualização de Entradas versus Saídas mensais.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              inflows: { color: 'hsl(var(--primary))', label: 'Entradas' },
              outflows: { color: 'hsl(var(--destructive))', label: 'Saídas' },
            }}
            className="h-[350px] w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis tickFormatter={(v) => `R$ ${v / 1000}k`} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="inflows" fill="var(--color-inflows)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflows" fill="var(--color-outflows)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle>Saldo Diário do Período Selecionado</CardTitle>
            <CardDescription>Acompanhamento detalhado das contas bancárias.</CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="bg-white">
            <Download className="w-4 h-4 mr-2" /> Exportar Tabela
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted z-10 shadow-sm">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right text-primary">Total Entradas</TableHead>
                  <TableHead className="text-right text-destructive">Total Saídas</TableHead>
                  <TableHead className="text-right">Saldo do Dia</TableHead>
                  <TableHead className="text-right">Saldo Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação registrada no período filtrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  dailyData.map((d) => (
                    <TableRow key={d.date} className="hover:bg-muted/10">
                      <TableCell>
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right text-primary font-medium">
                        {formatCurrency(d.inflows)}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {formatCurrency(d.outflows)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${d.dailyBalance >= 0 ? 'text-primary' : 'text-destructive'}`}
                      >
                        {formatCurrency(d.dailyBalance)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-accent">
                        {formatCurrency(d.runningBalance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
