import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Transaction, TransactionType, TransactionStatus } from '@/lib/types'
import { useMainStore } from '@/stores/main'
import { formatCurrencyInput, parseCurrencyInput, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultType: TransactionType
  transactionToEdit?: Transaction | null
}

export function TransactionForm({ open, onOpenChange, defaultType, transactionToEdit }: Props) {
  const {
    addTransaction,
    addTransactions,
    updateTransaction,
    services,
    expenseCategories,
    isSyncing,
  } = useMainStore()

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: defaultType,
    status: 'Pendente',
    category: defaultType === 'Receita' ? services[0] || '' : expenseCategories[0] || '',
    date: new Date().toISOString().split('T')[0],
  })

  const [displayAmount, setDisplayAmount] = useState('')
  const [dateOpen, setDateOpen] = useState(false)

  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('Mensal')
  const [occurrences, setOccurrences] = useState('2')

  useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        setFormData({
          type: transactionToEdit.type,
          status: transactionToEdit.status,
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          category: transactionToEdit.category,
          date: transactionToEdit.date,
        })
        setDisplayAmount(formatCurrencyInput(Math.round(transactionToEdit.amount * 100).toString()))
        setIsRecurring(false)
      } else {
        setFormData({
          type: defaultType,
          status: 'Pendente',
          description: '',
          amount: undefined,
          category: defaultType === 'Receita' ? services[0] : expenseCategories[0],
          date: new Date().toISOString().split('T')[0],
        })
        setDisplayAmount('')
        setIsRecurring(false)
        setFrequency('Mensal')
        setOccurrences('2')
      }
    }
  }, [open, defaultType, transactionToEdit, services, expenseCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.description ||
      formData.amount === undefined ||
      !formData.date ||
      !formData.category
    ) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const payload = {
      description: formData.description,
      amount: Number(formData.amount),
      type: formData.type,
      status: formData.status,
      category: formData.category,
      date: new Date(formData.date + 'T00:00:00').toISOString(),
    }

    try {
      if (transactionToEdit) {
        const { id, created, updated, expand, collectionId, collectionName, ...safePayload } =
          payload as any
        await updateTransaction(transactionToEdit.id, safePayload as Transaction)
        toast({ title: 'Sucesso', description: 'Transação atualizada com sucesso na nuvem.' })
      } else {
        if (isRecurring) {
          const N = parseInt(occurrences, 10) || 2
          const txs: Partial<Transaction>[] = []
          let curDate = new Date(formData.date + 'T00:00:00')

          for (let i = 0; i < N; i++) {
            txs.push({
              ...payload,
              date: curDate.toISOString(),
            } as Transaction)

            if (frequency === 'Mensal') {
              curDate.setMonth(curDate.getMonth() + 1)
            } else if (frequency === 'Trimestral') {
              curDate.setMonth(curDate.getMonth() + 3)
            } else if (frequency === 'Anual') {
              curDate.setFullYear(curDate.getFullYear() + 1)
            }
          }
          await addTransactions(txs)
          toast({
            title: 'Sucesso',
            description: `${N} transações foram geradas na nuvem.`,
          })
        } else {
          await addTransaction(payload as Transaction)
          toast({ title: 'Sucesso', description: 'A transação foi salva com sucesso na nuvem.' })
        }
      }

      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro de Conexão', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setDisplayAmount(formatted)
    setFormData({ ...formData, amount: parseCurrencyInput(e.target.value) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transactionToEdit
              ? formData.type === 'Receita'
                ? 'Editar Receita'
                : 'Editar Despesa'
              : formData.type === 'Receita'
                ? 'Nova Receita'
                : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => {
                  const newType = v as TransactionType
                  setFormData({
                    ...formData,
                    type: newType,
                    category: newType === 'Receita' ? services[0] : expenseCategories[0],
                  })
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as TransactionStatus })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Descrição</Label>
            <Input
              className="h-9 text-sm"
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Categoria / Subcategoria</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formData.type === 'Receita' &&
                  services.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                {formData.type === 'Despesa' &&
                  expenseCategories.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Data</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-9 text-sm justify-start text-left font-normal',
                      !formData.date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      new Date(formData.date + 'T00:00:00').toLocaleDateString('pt-BR')
                    ) : (
                      <span>Selecionar</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                    onSelect={(d) => {
                      if (d) {
                        setFormData({ ...formData, date: d.toISOString().split('T')[0] })
                        setDateOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Valor</Label>
              <Input
                className="h-9 text-sm font-semibold"
                type="text"
                required
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {!transactionToEdit && (
            <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <Label
                  className="text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  onClick={() => setIsRecurring(!isRecurring)}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-primary" /> Lançamento Recorrente
                </Label>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
              {isRecurring && (
                <div className="grid grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Frequência</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v)}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Total de Ocorrências</Label>
                    <Input
                      type="number"
                      min={2}
                      max={120}
                      value={occurrences}
                      onChange={(e) => setOccurrences(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSyncing}
            className="w-full mt-4 bg-primary hover:bg-secondary text-primary-foreground font-semibold"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar Transação
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
