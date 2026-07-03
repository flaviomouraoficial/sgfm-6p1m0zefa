import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { useFinanceStore } from '@/stores/finance'
import { toast } from '@/hooks/use-toast'
import { parseCSVContent } from '@/lib/importUtils'
import {
  parseOFX,
  parseCSVWithMapping,
  findDuplicatesAndMatches,
  type StatementMatchResult,
} from '@/lib/statementUtils'
import { extractPdfText } from '@/lib/pdfUtils'
import { StatementUploadStep } from './reconciliacao/StatementUploadStep'
import { StatementMappingStep } from './reconciliacao/StatementMappingStep'
import { StatementPreviewStep } from './reconciliacao/StatementPreviewStep'
import { PdfPreviewStep, type PdfImportRow } from './reconciliacao/PdfPreviewStep'
import { Card, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { RefreshCw } from 'lucide-react'

type Step = 'upload' | 'mapping' | 'preview' | 'pdf-processing' | 'pdf-preview'

export function ReconciliacaoTab() {
  const { transactions } = useMainStore()
  const { contas } = useFinanceStore()

  const [step, setStep] = useState<Step>('upload')
  const [contaId, setContaId] = useState('')
  const [fileFormat, setFileFormat] = useState<'csv' | 'ofx' | 'pdf'>('csv')
  const [csvText, setCsvText] = useState('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [matches, setMatches] = useState<StatementMatchResult[]>([])
  const [pdfRows, setPdfRows] = useState<PdfImportRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFile = async (_file: File, format: 'csv' | 'ofx' | 'pdf', text: string) => {
    setFileFormat(format)

    if (format === 'pdf') {
      setStep('pdf-processing')
      try {
        const extractedText = await extractPdfText(_file)
        if (!extractedText.trim()) {
          toast({
            title: 'Aviso',
            description:
              'Não foi possível extrair texto do PDF. O arquivo pode estar protegido ou usar fontes embutidas. Tente exportar como CSV/OFX.',
            variant: 'destructive',
          })
          setStep('upload')
          return
        }

        const result = await pb.send('/backend/v1/import-pdf', {
          method: 'POST',
          body: JSON.stringify({ pdf_text: extractedText, conta_id: contaId }),
          headers: { 'Content-Type': 'application/json' },
        })

        if (!result.transactions || !Array.isArray(result.transactions)) {
          toast({
            title: 'Erro',
            description: 'Resposta inválida do servidor ao processar PDF.',
            variant: 'destructive',
          })
          setStep('upload')
          return
        }

        if (result.transactions.length === 0) {
          toast({
            title: 'Aviso',
            description:
              'Nenhuma transação foi identificada no PDF. Verifique se o arquivo contém um extrato bancário.',
            variant: 'destructive',
          })
          setStep('upload')
          return
        }

        const rows: PdfImportRow[] = result.transactions.map((tx: any) => {
          const isDuplicate = transactions.some(
            (t: any) =>
              t.date?.substring(0, 10) === tx.date &&
              t.amount === tx.amount &&
              t.description?.toLowerCase() === (tx.description || '').toLowerCase(),
          )
          const existingPendingMatch = transactions.find(
            (t: any) =>
              !t.conciliado &&
              t.amount === tx.amount &&
              t.type === tx.type &&
              t.conta_id === contaId,
          )
          return {
            date: tx.date || '',
            description: tx.description || '',
            document_number: tx.document_number || '',
            amount: tx.amount || 0,
            type: tx.type === 'Receita' ? 'Receita' : 'Despesa',
            category: 'Outros',
            isDuplicate,
            existingPendingMatch,
            ignored: isDuplicate,
          }
        })

        setPdfRows(rows)
        setStep('pdf-preview')
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: err?.message || 'Falha ao processar o PDF. Tente novamente.',
          variant: 'destructive',
        })
        setStep('upload')
      }
      return
    }

    if (format === 'ofx') {
      const rows = parseOFX(text)
      if (rows.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhuma transação encontrada no arquivo OFX.',
          variant: 'destructive',
        })
        return
      }
      const results = findDuplicatesAndMatches(rows, transactions, contaId)
      setMatches(results)
      setStep('preview')
    } else {
      const { headers } = parseCSVContent(text)
      if (headers.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhuma coluna encontrada no arquivo CSV.',
          variant: 'destructive',
        })
        return
      }
      setCsvText(text)
      setCsvHeaders(headers)
      setMapping({})
      setStep('mapping')
    }
  }

  const handleMappingConfirm = () => {
    const rows = parseCSVWithMapping(csvText, mapping)
    if (rows.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhuma transação válida encontrada com este mapeamento.',
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

  const handleConfirm = async () => {
    setIsProcessing(true)
    let created = 0
    let reconciled = 0
    let errors = 0

    for (const m of matches) {
      if (!m.selected) continue
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
            category: 'Outros',
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
      toast({
        title: 'Importação concluída',
        description: `${created} nova(s) transação(ões) criada(s), ${reconciled} conciliada(s).${
          errors > 0 ? ` ${errors} erro(s) durante o processo.` : ''
        }`,
      })
    } else if (errors > 0) {
      toast({
        title: 'Erro',
        description: `${errors} erro(s) durante a importação.`,
        variant: 'destructive',
      })
    }

    setStep('upload')
    setMatches([])
    setMapping({})
    setCsvText('')
    setCsvHeaders([])
  }

  const handlePdfConfirm = async (rows: PdfImportRow[]) => {
    setIsProcessing(true)
    let created = 0
    let reconciled = 0
    let errors = 0

    for (const row of rows) {
      try {
        if (row.existingPendingMatch) {
          await pb.collection('v1_transactions').update(row.existingPendingMatch.id, {
            conciliado: true,
          })
          reconciled++
        } else {
          await pb.collection('v1_transactions').create({
            description: row.description,
            amount: row.amount,
            type: row.type,
            date: row.date + 'T12:00:00.000Z',
            conta_id: contaId,
            status: 'Pago',
            conciliado: true,
            category: row.category || 'Outros',
            document_number: row.document_number || '',
          })
          created++
        }
      } catch (err) {
        errors++
      }
    }

    setIsProcessing(false)

    if (created > 0 || reconciled > 0) {
      toast({
        title: 'Importação concluída',
        description: `${created} nova(s) transação(ões) criada(s), ${reconciled} conciliada(s).${
          errors > 0 ? ` ${errors} erro(s) durante o processo.` : ''
        }`,
      })
    } else if (errors > 0) {
      toast({
        title: 'Erro',
        description: `${errors} erro(s) durante a importação.`,
        variant: 'destructive',
      })
    }

    setStep('upload')
    setPdfRows([])
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
          headers={csvHeaders}
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
          onConfirm={handleConfirm}
          onBack={() => setStep(fileFormat === 'ofx' ? 'upload' : 'mapping')}
          isProcessing={isProcessing}
        />
      )}
      {step === 'pdf-processing' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium">Processando PDF...</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Extraindo transações com inteligência artificial.
            </p>
          </CardContent>
        </Card>
      )}
      {step === 'pdf-preview' && (
        <PdfPreviewStep
          rows={pdfRows}
          onConfirm={handlePdfConfirm}
          onBack={() => setStep('upload')}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}
