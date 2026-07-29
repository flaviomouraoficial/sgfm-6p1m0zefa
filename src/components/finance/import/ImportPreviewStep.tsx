import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TransactionType, Transaction } from '@/lib/types'
import { validateImportData } from '@/lib/importUtils'
import { useMainStore } from '@/stores/main'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, AlertTriangle, Copy } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

interface Props {
  type: TransactionType
  headers: string[]
  rows: any[][]
  mapping: Record<string, string>
  onConfirm: () => void
  onBack: () => void
  onGoToUpload: () => void
}

export function ImportPreviewStep({
  type,
  headers,
  rows,
  mapping,
  onConfirm,
  onBack,
  onGoToUpload,
}: Props) {
  const { addTransactions, addService, addExpenseCategory, services, expenseCategories } =
    useMainStore()
  const { toast } = useToast()
  const [existingTxKeys, setExistingTxKeys] = useState<Set<string>>(new Set())
  const [checkingDuplicates, setCheckingDuplicates] = useState(true)

  const parsedData = useMemo(
    () => validateImportData(headers, rows, mapping, type),
    [headers, rows, mapping, type],
  )

  useEffect(() => {
    const checkDuplicates = async () => {
      setCheckingDuplicates(true)
      try {
        const allTx = await pb
          .collection('v1_transactions')
          .getFullList({ fields: 'description,amount,date' })
        const keys = new Set<string>()
        for (const tx of allTx) {
          const key = `${(tx.description || '').trim().toLowerCase()}|${(tx.date || '').substring(0, 7)}|${tx.amount}`
          keys.add(key)
        }
        setExistingTxKeys(keys)
      } catch {
        /* if fetch fails, skip dedup */
      } finally {
        setCheckingDuplicates(false)
      }
    }
    checkDuplicates()
  }, [])

  const dedupedData = useMemo(() => {
    return parsedData.map((row) => {
      if (!row.isValid) return { ...row, isDuplicate: false }
      const d = row.data
      const monthStr = (d.date || '').substring(0, 7)
      const key = `${(d.description || '').trim().toLowerCase()}|${monthStr}|${d.amount}`
      return { ...row, isDuplicate: existingTxKeys.has(key) }
    })
  }, [parsedData, existingTxKeys])

  const validRows = dedupedData.filter((r) => r.isValid && !r.isDuplicate)
  const duplicateRows = dedupedData.filter((r) => r.isDuplicate)
  const invalidRows = dedupedData.filter((r) => !r.isValid)
  const hasErrors = invalidRows.length > 0
  const hasDuplicates = duplicateRows.length > 0

  const handleConfirm = () => {
    if (validRows.length === 0) return
    const txs = validRows.map((r) => r.data as Transaction)
    txs.forEach((r) => {
      if (r.type === 'Receita' && r.service && !services.includes(r.service)) addService(r.service)
      if (r.type === 'Despesa' && r.category && !expenseCategories.includes(r.category))
        addExpenseCategory(r.category)
    })
    addTransactions(txs)
    let msg = `${txs.length} transações importadas com sucesso.`
    if (duplicateRows.length > 0) msg += ` ${duplicateRows.length} duplicatas foram ignoradas.`
    if (invalidRows.length > 0) msg += ` ${invalidRows.length} linhas com erro rejeitadas.`
    toast({ title: 'Importação concluída', description: msg })
    onConfirm()
  }

  if (checkingDuplicates) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin mr-3" />
        <span className="text-muted-foreground">Verificando duplicatas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-2 animate-fade-in-up">
      {(hasErrors || hasDuplicates) && (
        <Alert variant={hasErrors ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {hasErrors ? 'Erros e ' : ''}
            {hasDuplicates ? 'Duplicatas' : ''} Encontradas
          </AlertTitle>
          <AlertDescription>
            {hasDuplicates && `${duplicateRows.length} linha(s) duplicada(s) serão ignoradas. `}
            {hasErrors && `${invalidRows.length} linha(s) com erro não serão importadas.`}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-muted/30 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Válidas</span>
          <span className="text-2xl font-bold text-green-600">{validRows.length}</span>
        </div>
        <div className="p-4 rounded-xl border bg-blue-50 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Duplicatas</span>
          <span className="text-2xl font-bold text-blue-600">{duplicateRows.length}</span>
        </div>
        <div className="p-4 rounded-xl border bg-destructive/5 flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Erros</span>
          <span className="text-2xl font-bold text-destructive">{invalidRows.length}</span>
        </div>
      </div>
      <ScrollArea className="h-[250px] border rounded-md p-4 bg-muted/10">
        <div className="space-y-3">
          {dedupedData.map((row, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-md text-sm border ${row.isDuplicate ? 'bg-blue-50 border-blue-300' : row.isValid ? 'bg-background border-border' : 'bg-destructive/10 border-destructive/30'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium flex items-center gap-2">
                  {row.isDuplicate ? (
                    <>
                      <Copy className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-600 font-bold">
                        Duplicata (Linha {row.rowIndex})
                      </span>
                    </>
                  ) : row.isValid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-muted-foreground">Linha {row.rowIndex}:</span>{' '}
                      {row.raw[mapping.description] || 'Sem descrição'}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-destructive font-bold">Linha {row.rowIndex}</span>
                    </>
                  )}
                </div>
                {row.isValid && !row.isDuplicate && (
                  <div
                    className={`font-semibold ${type === 'Receita' ? 'text-green-600' : 'text-destructive'}`}
                  >
                    {row.data.amount !== undefined ? formatCurrency(row.data.amount) : '-'}
                  </div>
                )}
              </div>
              {!row.isValid && (
                <ul className="list-disc list-inside text-sm text-destructive font-medium space-y-1 pl-6">
                  {row.errors.map((err, errIdx) => (
                    <li key={errIdx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex justify-between mt-6">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          {(hasErrors || hasDuplicates) && (
            <Button variant="secondary" onClick={onGoToUpload}>
              Enviar Nova Planilha
            </Button>
          )}
        </div>
        <Button onClick={handleConfirm} disabled={validRows.length === 0}>
          {validRows.length === 0
            ? 'Nenhuma linha válida'
            : `Importar ${validRows.length} transação(ões)`}
        </Button>
      </div>
    </div>
  )
}
