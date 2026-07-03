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
import { StatementUploadStep } from './reconciliacao/StatementUploadStep'
import { StatementMappingStep } from './reconciliacao/StatementMappingStep'
import { StatementPreviewStep } from './reconciliacao/StatementPreviewStep'
import pb from '@/lib/pocketbase/client'

type Step = 'upload' | 'mapping' | 'preview'

export function ReconciliacaoTab() {
  const { transactions } = useMainStore()
  const { contas } = useFinanceStore()

  const [step, setStep] = useState<Step>('upload')
  const [contaId, setContaId] = useState('')
  const [fileFormat, setFileFormat] = useState<'csv' | 'ofx'>('csv')
  const [csvText, setCsvText] = useState('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [matches, setMatches] = useState<StatementMatchResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFile = (_file: File, format: 'csv' | 'ofx', text: string) => {
    setFileFormat(format)
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
    </div>
  )
}
