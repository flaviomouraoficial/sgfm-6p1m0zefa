import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMainStore, FinancialForecast } from '@/stores/main'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export function ForecastModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const {
    annualRevenueTarget,
    financialForecasts,
    setAnnualRevenueTarget,
    setFinancialForecasts,
    isSyncing,
  } = useMainStore()

  const [localTarget, setLocalTarget] = useState('')
  const [localForecasts, setLocalForecasts] = useState<FinancialForecast[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setLocalTarget(formatCurrencyInput(Math.round((annualRevenueTarget || 0) * 100).toString()))

      const currentYear = new Date().getFullYear()
      const initialForecasts = Array.from({ length: 12 }).map((_, i) => {
        const monthStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`
        const existing = financialForecasts?.find((f) => f.month === monthStr)
        return existing || { month: monthStr, expectedIncome: 0, expectedExpense: 0 }
      })
      setLocalForecasts(initialForecasts)
    }
  }, [open, annualRevenueTarget, financialForecasts])

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)
    try {
      await setAnnualRevenueTarget(parseCurrencyInput(localTarget))
      await setFinancialForecasts(localForecasts)
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      setError(
        getErrorMessage(err) ||
          'Falha ao salvar as metas. Verifique sua conexão e tente novamente.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const updateForecast = (
    index: number,
    field: 'expectedIncome' | 'expectedExpense',
    val: string,
  ) => {
    const num = parseCurrencyInput(val)
    const newF = [...localForecasts]
    newF[index] = { ...newF[index], [field]: num }
    setLocalForecasts(newF)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Metas e Previsões Financeiras</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm mt-2">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 mt-2">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-primary">Meta de Faturamento Anual</Label>
            <Input
              value={localTarget}
              onChange={(e) => setLocalTarget(formatCurrencyInput(e.target.value))}
              className="text-lg font-bold h-12"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-secondary">
              Previsões Mensais ({new Date().getFullYear()})
            </Label>
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 text-xs font-semibold text-muted-foreground pb-2 border-b">
              <span>Mês</span>
              <span>Receita Prevista</span>
              <span>Despesa Prevista</span>
            </div>
            {localForecasts.map((f, i) => {
              const d = new Date(f.month + '-02T00:00:00')
              const monthName = d.toLocaleString('pt-BR', { month: 'long' })
              return (
                <div key={f.month} className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
                  <span className="text-sm capitalize font-medium">{monthName}</span>
                  <Input
                    className="h-8 text-xs"
                    value={formatCurrencyInput(
                      Math.round((f.expectedIncome || 0) * 100).toString(),
                    )}
                    onChange={(e) => updateForecast(i, 'expectedIncome', e.target.value)}
                  />
                  <Input
                    className="h-8 text-xs"
                    value={formatCurrencyInput(
                      Math.round((f.expectedExpense || 0) * 100).toString(),
                    )}
                    onChange={(e) => updateForecast(i, 'expectedExpense', e.target.value)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="mt-4 shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isSyncing}>
            {(isSaving || isSyncing) && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Metas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
