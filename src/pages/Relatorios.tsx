import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Search } from 'lucide-react'
import { exportToCSV } from '@/lib/utils'

export default function Relatorios() {
  const { transactions, mentees, clientSessions, clients } = useMainStore()
  const [reportType, setReportType] = useState('financeiro')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')

  const financialData = useMemo(() => {
    let data = transactions
    if (startDate) data = data.filter((t) => t.date >= startDate)
    if (endDate) data = data.filter((t) => t.date <= endDate)
    if (search)
      data = data.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
    return data.map((t) => ({
      Data: new Date(t.date).toLocaleDateString('pt-BR'),
      Descrição: t.description,
      Valor: t.amount,
      Tipo: t.type,
      Status: t.status,
      Categoria: t.category,
      Conta: (t as any).account || '-',
    }))
  }, [transactions, startDate, endDate, search])

  const operationalData = useMemo(() => {
    let data = clientSessions
    if (startDate) data = data.filter((s) => s.date && s.date >= startDate)
    if (endDate) data = data.filter((s) => s.date && s.date <= endDate)
    return data.map((s) => {
      const mentee = mentees.find((m) => m.id === s.mentee_id)
      const client = clients.find((c) => c.id === s.client_id)
      return {
        Data: s.date ? new Date(s.date).toLocaleDateString('pt-BR') : '-',
        Duração: `${s.duration} min`,
        Tipo: s.type || '-',
        Status: s.status || '-',
        Mentorado: mentee ? mentee.name : '-',
        Cliente: client ? client.name : '-',
        Discussão: s.discussion || '-',
      }
    })
  }, [clientSessions, mentees, clients, startDate, endDate])

  const handleExportCSV = () => {
    const data = reportType === 'financeiro' ? financialData : operationalData
    exportToCSV(`relatorio_${reportType}.csv`, data)
  }

  const currentData = reportType === 'financeiro' ? financialData : operationalData

  return (
    <div className="space-y-6 print:space-y-0 print:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent">Relatórios Corporativos</h1>
          <p className="text-muted-foreground mt-1">
            Geração de relatórios baseados em dados estruturados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="bg-white">
            <Download className="w-4 h-4 mr-2" /> Exportar PDF (Print)
          </Button>
          <Button onClick={handleExportCSV} className="bg-primary hover:bg-secondary">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Relatório{' '}
          {reportType === 'financeiro' ? 'Financeiro Consolidado' : 'Operacional de Sessões'}
        </h1>
        <p className="text-gray-500">
          Período: {startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} até{' '}
          {endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'}
        </p>
      </div>

      <Card className="shadow-sm print:hidden border-border/60">
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
          <CardDescription>Defina os parâmetros para gerar os dados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="operacional">Operacional (Sessões)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Data Inicial</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Data Final</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {reportType === 'financeiro' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold">Busca</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Descrição..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60 print:border-none print:shadow-none">
        <CardHeader className="print:hidden">
          <CardTitle className="text-lg">Resultados ({currentData.length} registros)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto print:overflow-visible">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                {currentData.length > 0 &&
                  Object.keys(currentData[0]).map((key) => <TableHead key={key}>{key}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado para os filtros informados.
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((row, i) => (
                  <TableRow key={i}>
                    {Object.values(row).map((val: any, idx) => (
                      <TableCell key={idx} className="whitespace-nowrap">
                        {val}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
