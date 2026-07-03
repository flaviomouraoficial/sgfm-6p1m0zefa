import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { autoDetectMapping } from '@/lib/statementUtils'
import { AlertTriangle } from 'lucide-react'

interface Props {
  headers: string[]
  mapping: Record<string, string>
  onMappingChange: (m: Record<string, string>) => void
  onConfirm: () => void
  onBack: () => void
}

const fields = [
  { key: 'date', label: 'Data (Obrigatório)' },
  { key: 'description', label: 'Descrição / Histórico (Obrigatório)' },
  { key: 'amount', label: 'Valor (Obrigatório)' },
  { key: 'documentNumber', label: 'Número do Documento (Opcional)' },
]

export function StatementMappingStep({
  headers,
  mapping,
  onMappingChange,
  onConfirm,
  onBack,
}: Props) {
  useEffect(() => {
    if (headers.length > 0 && Object.keys(mapping).length === 0) {
      onMappingChange(autoDetectMapping(headers))
    }
  }, [headers]) // eslint-disable-line react-hooks/exhaustive-deps

  const isValid = mapping.date && mapping.description && mapping.amount
  const noAutoDetection = !mapping.date && !mapping.description && !mapping.amount

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapeamento de Colunas</CardTitle>
        <CardDescription>
          Associe as colunas da planilha XLSX aos campos do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {noAutoDetection && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Estrutura do arquivo não reconhecida</AlertTitle>
            <AlertDescription>
              Não foi possível identificar automaticamente as colunas necessárias. Verifique se o
              arquivo contém as colunas: <strong>Data</strong>, <strong>Histórico/Descrição</strong>{' '}
              e <strong>Valor</strong>. Mapeie manualmente as colunas abaixo.
            </AlertDescription>
          </Alert>
        )}
        {fields.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card"
          >
            <Label className="text-sm font-medium w-1/2">{f.label}</Label>
            <Select
              value={mapping[f.key] || ''}
              onValueChange={(v) => onMappingChange({ ...mapping, [f.key]: v })}
            >
              <SelectTrigger className="w-1/2 bg-background">
                <SelectValue placeholder="Selecione a coluna..." />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={onConfirm} disabled={!isValid}>
            Pré-visualizar Dados
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
