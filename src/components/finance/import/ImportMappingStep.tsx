import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionType } from '@/lib/types'

interface Props {
  type: TransactionType
  headers: string[]
  mapping: Record<string, string>
  onChangeMapping: (m: Record<string, string>) => void
  onNext: () => void
  onBack: () => void
}

const requiredFields = [
  { key: 'date', label: 'Data (Obrigatório)' },
  { key: 'amount', label: 'Valor (Obrigatório)' },
  { key: 'description', label: 'Descrição (Obrigatório)' },
]

export function ImportMappingStep({
  type,
  headers,
  mapping,
  onChangeMapping,
  onNext,
  onBack,
}: Props) {
  useEffect(() => {
    if (headers.length > 0 && Object.keys(mapping).length === 0) {
      const initial: Record<string, string> = {}
      const hLow = headers.map((h) => h.toLowerCase())
      const findMatch = (keywords: string[]) => {
        const idx = hLow.findIndex((h) => keywords.some((k) => h.includes(k)))
        return idx >= 0 ? headers[idx] : ''
      }

      initial.date = findMatch(['data', 'date', 'vencimento'])
      initial.description = findMatch(['desc', 'histórico', 'historico'])
      initial.amount = findMatch(['valor', 'amount'])
      initial.entity = findMatch(['cliente', 'fornecedor', 'entidade', 'client', 'supplier'])
      initial.category = findMatch(['categoria', 'serviço', 'servico', 'service', 'category'])
      initial.paymentMethod = findMatch(['pagamento', 'forma', 'método', 'metodo'])

      onChangeMapping(initial)
    }
  }, [headers]) // eslint-disable-line react-hooks/exhaustive-deps

  const entityLabel = type === 'Receita' ? 'Cliente (Obrigatório)' : 'Fornecedor (Obrigatório)'
  const catLabel = 'Categoria (Opcional)'

  const fields = [
    ...requiredFields,
    { key: 'entity', label: entityLabel },
    { key: 'category', label: catLabel },
    { key: 'paymentMethod', label: 'Forma de Pagamento (Opcional)' },
  ]

  const isNextDisabled =
    !mapping['date'] || !mapping['description'] || !mapping['amount'] || !mapping['entity']

  return (
    <div className="space-y-6 pt-2 animate-fade-in-up">
      <p className="text-sm text-muted-foreground">
        Associe as colunas do seu arquivo aos campos do sistema.
      </p>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {fields.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card"
          >
            <span className="text-sm font-medium w-1/2">{f.label}</span>
            <Select
              value={mapping[f.key] || ''}
              onValueChange={(v) => onChangeMapping({ ...mapping, [f.key]: v })}
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
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} disabled={isNextDisabled}>
          Validar Dados
        </Button>
      </div>
    </div>
  )
}
