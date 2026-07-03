import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { useFinanceStore } from '@/stores/finance'
import { toast } from '@/hooks/use-toast'
import {
  parseRowsWithMapping,
  findDuplicatesAndMatches,
  type StatementMatchResult,
} from '@/lib/statementUtils'
import { parseXlsx } from '@/lib/xlsx'
import { StatementUploadStep } from './reconciliacao/StatementUploadStep'
import { StatementMappingStep } from './reconciliacao/StatementMappingStep'
import { StatementPreviewStep } from './reconciliacao/StatementPreviewStep'
import { Card, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { RefreshCw } from 'lucide-react'

type Step = 'upload' | 'mapping' | 'preview'

export function ReconciliacaoTab() {
  const { transactions } = useMainStore()
  const { contas } = useFinanceStore()

  const [step, setStep] = useState<Step>('upload')
  const [contaId, setContaId] = useState('')
  const [xlsxHeaders, setXlsxHeaders] = useState<string[]>([])
  const [xlsxRows, setXlsxRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [matches, setMatches] = useState<StatementMatchResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFile = async (file: File) => {
    try {
      const { headers, rows } = await parseXlsx(file)
      if (headers.length === 0) {
        toast({
          title: 'Erro',
          description:
            'Nenhuma coluna encontrada no arquivo XLSX. Verifique se a primeira linha contém os cabeçalhos.',
          variant: 'destructive',
        })
        return
      }
      if (rows.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhuma transação encontrada no arquivo XLSX.',
          variant: 'destructive',
        })
        return
      }
      setXlsxHeaders(headers)
      setXlsxRows(rows)
      setMapping({})
      setStep('mapping')
    } catch (err) {
      toast({
        title: 'Erro',
        description:
          'Falha ao ler o arquivo XLSX. Verifique se o arquivo não está corrompido e está no formato Excel correto.',
        variant: 'destructive',
      })
    }
  }

  const handleMappingConfirm = () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      toast({
        title: 'Mapeamento incompleto',
        description: 'Associe as colunas Data, Descrição e Valor antes de continuar.',
        variant: 'destructive',
      })
      return
    }

    const rows = parseRowsWithMapping(xlsxHeaders, xlsxRows, mapping)
    if (rows.length === 0) {
      toast({
        title: 'Aviso',
        description:
          'Nenhuma transação válida encontrada com este mapeamento. Verifique se as colunas estão corretas.',
        variant: 'destructive',
      })
      return
    }
    const results = findDuplicatesAndMatches(rows, transactions, contaId)
    setMatches(results)
    setStep('preview')
  }

  const toggleRow = (index: number) => {
    setMatches((prev) => prev.map((m, i) => (i === index ? { ...m, selected: !m.selected } : m)))
  }

  const updateMatch = (index: number, field: string, value: any) => {
    setMatches((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m
        if (field === 'description' || field === 'category') {
          return { ...m, row: { ...m.row, [field]: value } }
        }
        return m
      }),
    )
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    let created = 0
    let reconciled = 0
    let duplicates = 0
    let errors = 0

    for (const m of matches) {
      if (m.isDuplicate && !m.selected) {
        duplicates++
        continue
      }
      if (!m.selected) continue
      if (m.isDuplicate) {
        duplicates++
        continue
      }
      try {
        if (m.existingPendingMatch) {
          await pb.collection('v1_transactions').update(m.existingPendingMatch.id, {
            conciliado: true,
          })
          reconciled++
        } else {
          await pb.collection('v1_transactions').create({
            description: m.row.description,
            amount: m.row.amount,
            type: m.row.type,
            date: m.row.date + 'T12:00:00.000Z',
            conta_id: contaId,
            status: 'Pago',
            conciliado: true,
            category: m.row.category || 'Outros',
            document_number: m.row.documentNumber || '',
          })
          created++
        }
      } catch (err) {
        errors++
      }
    }

    setIsProcessing(false)

    if (created > 0 || reconciled > 0) {
      const parts: string[] = []
      if (created > 0) parts.push(`${created} nova(s) transação(ões) criada(s)`)
      if (reconciled > 0) parts.push(`${reconciled} conciliada(s)`)
      if (duplicates > 0) parts.push(`${duplicates} duplicata(s) ignorada(s)`)
      if (errors > 0) parts.push(`${errors} erro(s)`)
      toast({
        title: 'Importação concluída',
        description: parts.join(', ') + '.',
      })
    } else if (errors > 0) {
      toast({
        title: 'Erro',
        description: `${errors} erro(s) durante a importação.`,
        variant: 'destructive',
      })
    } else if (duplicates > 0) {
      toast({
        title: 'Aviso',
        description: `${duplicates} duplicata(s) ignorada(s). Nenhuma nova transação foi criada.`,
      })
    }

    setStep('upload')
    setMatches([])
    setMapping({})
    setXlsxHeaders([])
    setXlsxRows([])
  }

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <StatementUploadStep
          contas={contas}
          contaId={contaId}
          onContaChange={setContaId}
          onFile={handleFile}
        />
      )}
      {step === 'mapping' && (
        <StatementMappingStep
          headers={xlsxHeaders}
          mapping={mapping}
          onMappingChange={setMapping}
          onConfirm={handleMappingConfirm}
          onBack={() => setStep('upload')}
        />
      )}
      {step === 'preview' && (
        <StatementPreviewStep
          matches={matches}
          onToggleRow={toggleRow}
          onUpdateRow={updateMatch}
          onConfirm={handleConfirm}
          onBack={() => setStep('mapping')}
          isProcessing={isProcessing}
        />
      )}
      {isProcessing && step === 'preview' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium">Processando...</h3>
            <p className="text-sm text-muted-foreground mt-2">Criando e conciliando transações.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
