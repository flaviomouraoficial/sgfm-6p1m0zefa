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
import { StatementMatchResult } from '@/lib/statementUtils'
import { RefreshCw, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react'

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

interface Props {
  matches: StatementMatchResult[]
  onToggleRow: (index: number) => void
  onUpdateRow: (index: number, field: string, value: any) => void
  onConfirm: () => void
  onBack: () => void
  isProcessing: boolean
}

export function StatementPreviewStep({
  matches,
  onToggleRow,
  onUpdateRow,
  onConfirm,
  onBack,
  isProcessing,
}: Props) {
  const selectedCount = matches.filter((m) => m.selected).length
  const duplicateCount = matches.filter((m) => m.isDuplicate).length
  const matchCount = matches.filter((m) => m.existingPendingMatch && m.selected).length
  const newCount = selectedCount - matchCount

  return (
    <div className="space-y-4 animate-fade-in-up">
      {duplicateCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Possíveis Duplicatas Detectadas</AlertTitle>
          <AlertDescription>
            {duplicateCount} transação(ões) com mesma data, valor e descrição já existem. Foram
            desmarcadas por padrão — revise antes de prosseguir.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{matches.length}</span>
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
          <CardTitle>Pré-visualização das Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/30 z-10">
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Doc.</TableHead>
                  <TableHead className="w-28 text-right">Valor</TableHead>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead className="w-36">Categoria</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m, i) => (
                  <TableRow key={i} className={m.isDuplicate ? 'bg-yellow-500/5' : ''}>
                    <TableCell>
                      <Checkbox checked={m.selected} onCheckedChange={() => onToggleRow(i)} />
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{m.row.date}</TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs p-1"
                        value={m.row.description}
                        onChange={(e) => onUpdateRow(i, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.row.documentNumber || '-'}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-medium whitespace-nowrap ${
                        m.row.type === 'Receita' ? 'text-primary' : 'text-destructive'
                      }`}
                    >
                      {formatCurrency(m.row.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.row.type === 'Receita' ? 'default' : 'destructive'}
                        className="text-[10px]"
                      >
                        {m.row.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={m.row.category || 'Outros'}
                        onValueChange={(v) => onUpdateRow(i, 'category', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(m.row.type === 'Receita' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES).map(
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
                      {m.isDuplicate ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600/30">
                          Duplicata
                        </Badge>
                      ) : m.existingPendingMatch ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-600/30 gap-1">
                          <Link2 className="w-3 h-3" /> Conciliar
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600/30 gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Nova
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
        <Button onClick={onConfirm} disabled={selectedCount === 0 || isProcessing}>
          {isProcessing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          {selectedCount > 0
            ? `Importar ${selectedCount} transação(ões)`
            : 'Selecione ao menos uma'}
        </Button>
      </div>
    </div>
  )
}
