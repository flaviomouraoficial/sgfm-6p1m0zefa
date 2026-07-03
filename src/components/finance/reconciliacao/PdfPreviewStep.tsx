import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export interface PdfImportRow {
  date: string
  description: string
  document_number: string
  amount: number
  type: 'Receita' | 'Despesa'
  category: string
  isDuplicate: boolean
  existingPendingMatch?: any
  ignored: boolean
}

interface Props {
  rows: PdfImportRow[]
  onConfirm: (rows: PdfImportRow[]) => void
  onBack: () => void
  isProcessing: boolean
}

const EXPENSE_CATEGORIES = [
  'Outros',
  'Software',
  'Marketing',
  'Aluguel',
  'Salários',
  'Impostos',
  'Utilities',
  'Transporte',
  'Alimentação',
  'Consultoria',
]
const REVENUE_CATEGORIES = ['Consultoria', 'Mentoria', 'Treinamento', 'Serviços', 'Outros']

export function PdfPreviewStep({ rows: initialRows, onConfirm, onBack, isProcessing }: Props) {
  const [rows, setRows] = useState<PdfImportRow[]>(initialRows)

  const updateRow = (index: number, field: keyof PdfImportRow, value: any) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const toggleIgnore = (index: number) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ignored: !r.ignored } : r)))
  }

  const selectedRows = rows.filter((r) => !r.ignored)
  const duplicateCount = rows.filter((r) => r.isDuplicate && !r.ignored).length
  const matchCount = rows.filter((r) => r.existingPendingMatch && !r.ignored).length
  const newCount = selectedRows.length - matchCount

  const handleConfirm = () => {
    onConfirm(selectedRows)
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {duplicateCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Possíveis Duplicatas Detectadas</AlertTitle>
          <AlertDescription>
            {duplicateCount} transação(ões) com mesma data, valor e descrição já existem. Revise
            antes de prosseguir.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{rows.length}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Duplicatas</span>
          <span className="text-xl font-bold text-yellow-600">{duplicateCount}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground">A Conciliar</span>
          <span className="text-xl font-bold text-blue-600">{matchCount}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Novas</span>
          <span className="text-xl font-bold text-green-600">{newCount}</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações Extraídas do PDF</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[450px]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/30 z-10">
                <TableRow>
                  <TableHead className="w-10">Incl.</TableHead>
                  <TableHead className="w-32">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Doc.</TableHead>
                  <TableHead className="w-32">Valor</TableHead>
                  <TableHead className="w-28">Tipo</TableHead>
                  <TableHead className="w-36">Categoria</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className={
                      row.ignored ? 'opacity-40' : row.isDuplicate ? 'bg-yellow-500/5' : ''
                    }
                  >
                    <TableCell>
                      <Checkbox checked={!row.ignored} onCheckedChange={() => toggleIgnore(i)} />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs p-1"
                        value={row.date}
                        onChange={(e) => updateRow(i, 'date', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs p-1"
                        value={row.description}
                        onChange={(e) => updateRow(i, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs p-1"
                        value={row.document_number}
                        onChange={(e) => updateRow(i, 'document_number', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs p-1 text-right"
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => updateRow(i, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.type}
                        onValueChange={(v) => updateRow(i, 'type', v as 'Receita' | 'Despesa')}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Receita">Receita</SelectItem>
                          <SelectItem value="Despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.category}
                        onValueChange={(v) => updateRow(i, 'category', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(row.type === 'Receita' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES).map(
                            (c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {row.ignored ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Ignorado
                        </Badge>
                      ) : row.isDuplicate ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600/30">
                          Duplicata
                        </Badge>
                      ) : row.existingPendingMatch ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-600/30">
                          Conciliar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600/30">
                          Nova
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          Voltar
        </Button>
        <Button onClick={handleConfirm} disabled={selectedRows.length === 0 || isProcessing}>
          {isProcessing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          {selectedRows.length > 0
            ? `Importar ${selectedRows.length} transação(ões)`
            : 'Selecione ao menos uma'}
        </Button>
      </div>
    </div>
  )
}
