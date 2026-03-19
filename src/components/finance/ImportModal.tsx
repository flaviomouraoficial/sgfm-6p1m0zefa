import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { TransactionType } from '@/lib/types'
import { ImportTypeStep } from './import/ImportTypeStep'
import { ImportUploadStep } from './import/ImportUploadStep'
import { ImportMappingStep } from './import/ImportMappingStep'
import { ImportPreviewStep } from './import/ImportPreviewStep'

export type ImportStep = 'type' | 'upload' | 'mapping' | 'preview'

export function ImportModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [step, setStep] = useState<ImportStep>('type')
  const [type, setType] = useState<TransactionType>('Despesa')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setStep('type')
      setHeaders([])
      setRows([])
      setMapping({})
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Assistente de Importação</DialogTitle>
          <DialogDescription>
            Siga os passos para importar suas planilhas de forma segura.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {step === 'type' && (
            <ImportTypeStep selected={type} onSelect={setType} onNext={() => setStep('upload')} />
          )}
          {step === 'upload' && (
            <ImportUploadStep
              onUpload={(h, r) => {
                setHeaders(h)
                setRows(r)
                setStep('mapping')
              }}
              onBack={() => setStep('type')}
            />
          )}
          {step === 'mapping' && (
            <ImportMappingStep
              type={type}
              headers={headers}
              mapping={mapping}
              onChangeMapping={setMapping}
              onNext={() => setStep('preview')}
              onBack={() => setStep('upload')}
            />
          )}
          {step === 'preview' && (
            <ImportPreviewStep
              type={type}
              headers={headers}
              rows={rows}
              mapping={mapping}
              onConfirm={() => onOpenChange(false)}
              onBack={() => setStep('mapping')}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
