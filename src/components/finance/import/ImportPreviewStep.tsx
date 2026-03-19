import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TransactionType, Transaction } from '@/lib/types'
import { validateImportData } from '@/lib/importUtils'
import { useMainStore } from '@/stores/main'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Props {
  type: TransactionType
  headers: string[]
  rows: any[][]
  mapping: Record<string, string>
  onConfirm: () => void
  onBack: () => void
}

export function ImportPreviewStep({ type, headers, rows, mapping, onConfirm, onBack }: Props) {
  const { addTransactions, addService, addExpenseCategory, services, expenseCategories } =
    useMainStore()
  const { toast } = useToast()

  const parsedData = useMemo(
    () => validateImportData(headers, rows, mapping, type),
    [headers, rows, mapping, type],
  )

  const validRows = parsedData.filter((r) => r.isValid)
  const invalidRows = parsedData.filter((r) => !r.isValid)
  const hasErrors = invalidRows.length > 0

  const handleConfirm = () => {
    if (hasErrors) return
    const txs = validRows.map((r) => r.data as Transaction)
    txs.forEach((r) => {
      if (r.type === 'Receita' && r.service && !services.includes(r.service)) {
        addService(r.service)
      }
      if (r.type === 'Despesa' && r.category && !expenseCategories.includes(r.category)) {
        addExpenseCategory(r.category)
      }
    })
    addTransactions(txs)
    toast({
      title: 'Importação concluída',
      description: `${txs.length} transações importadas com sucesso.`,
    })
    onConfirm()
  }

  return (
    <div className="space-y-4 pt-2 animate-fade-in-up">
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erros encontrados</AlertTitle>
          <AlertDescription>
            Corrija os erros na planilha ou no mapeamento para prosseguir. A importação parcial não
            é permitida.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-muted/30 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Linhas Válidas</span>
          <span className="text-2xl font-bold text-green-600">{validRows.length}</span>
        </div>
        <div className="p-4 rounded-xl border bg-destructive/5 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Linhas com Erro</span>
          <span className="text-2xl font-bold text-destructive">{invalidRows.length}</span>
        </div>
      </div>

      <ScrollArea className="h-[250px] border rounded-md p-4 bg-muted/10">
        <div className="space-y-2">
          {parsedData.map((row, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-md text-sm border ${row.isValid ? 'bg-background border-border' : 'bg-destructive/10 border-destructive/30'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium flex items-center gap-2">
                  {row.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  Linha {row.rowIndex}: {row.raw[mapping.description] || 'Sem descrição'}
                </div>
                <div
                  className={`font-semibold ${type === 'Receita' ? 'text-green-600' : 'text-destructive'}`}
                >
                  {row.data.amount
                    ? `R$ ${row.data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '-'}
                </div>
              </div>
              {!row.isValid && (
                <div className="text-xs text-destructive mt-1 font-medium">
                  Erros: {row.errors.join(' | ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleConfirm} disabled={hasErrors || validRows.length === 0}>
          Confirmar Importação
        </Button>
      </div>
    </div>
  )
}
