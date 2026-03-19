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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Transaction, TransactionType, TransactionStatus, Attachment } from '@/lib/types'
import { useMainStore } from '@/stores/main'
import { formatCurrencyInput, parseCurrencyInput, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon, Paperclip, Upload, X, RefreshCw } from 'lucide-react'

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
    updateTransactionGroup,
    companies,
    banks,
    services,
    expenseCategories,
    paymentMethods,
  } = useMainStore()

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: defaultType,
    status: 'Pendente',
    company: companies[0] || '',
    bank: banks[0] || '',
    service: services[0] || '',
    category: expenseCategories[0] || '',
    paymentMethod: paymentMethods[0] || '',
    performer: 'Eu',
    client: '',
    supplier: '',
    paymentLink: '',
    entryDate: new Date().toISOString().split('T')[0],
    attachments: [],
  })

  const [displayAmount, setDisplayAmount] = useState('')
  const [entryDateOpen, setEntryDateOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('Mensal')
  const [occurrences, setOccurrences] = useState('2')
  const [updateModeDialogOpen, setUpdateModeDialogOpen] = useState(false)

  useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        setFormData({ ...transactionToEdit, attachments: transactionToEdit.attachments || [] })
        setDisplayAmount(formatCurrencyInput(Math.round(transactionToEdit.amount * 100).toString()))
        setIsRecurring(false)
      } else {
        setFormData((prev) => ({
          ...prev,
          type: defaultType,
          entryDate: new Date().toISOString().split('T')[0],
          date: '',
          description: '',
          amount: undefined,
          client: '',
          supplier: '',
          paymentLink: '',
          status: 'Pendente',
          attachments: [],
        }))
        setDisplayAmount('')
        setIsRecurring(false)
        setFrequency('Mensal')
        setOccurrences('2')
      }
    }
  }, [open, defaultType, transactionToEdit])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          setFormData((prev) => ({
            ...prev,
            attachments: [
              ...(prev.attachments || []),
              {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.type,
                url: event.target?.result as string,
              },
            ],
          }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeAttachment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((a) => a.id !== id) || [],
    }))
  }

  const executeSave = (mode: 'single' | 'future' = 'single') => {
    const isReceitaSubmit = formData.type === 'Receita'
    const nowISO = new Date().toISOString()
    const payload = { ...formData, amount: Number(formData.amount), updatedAt: nowISO }
    if (!isReceitaSubmit) payload.paymentLink = undefined

    if (transactionToEdit) {
      if (transactionToEdit.recurringGroupId && mode === 'future') {
        updateTransactionGroup(
          transactionToEdit.recurringGroupId,
          transactionToEdit.date,
          payload as Transaction,
        )
        toast({
          title: 'Sucesso',
          description: 'Transação e suas parcelas futuras foram atualizadas.',
        })
      } else {
        updateTransaction(transactionToEdit.id, payload as Transaction)
        toast({ title: 'Sucesso', description: 'Transação atualizada com sucesso.' })
      }
    } else {
      const baseId = Math.random().toString(36).substr(2, 9)
      if (isRecurring) {
        const N = parseInt(occurrences, 10) || 2
        const groupId = 'grp_' + baseId
        const txs: Transaction[] = []
        let curDate = new Date(formData.date! + 'T00:00:00')
        let curEntry = new Date(formData.entryDate! + 'T00:00:00')

        for (let i = 0; i < N; i++) {
          txs.push({
            ...payload,
            id: Math.random().toString(36).substr(2, 9),
            recurringGroupId: groupId,
            recurrence: { frequency: frequency as any, current: i + 1, total: N },
            date: curDate.toISOString().split('T')[0],
            entryDate: curEntry.toISOString().split('T')[0],
          } as Transaction)

          if (frequency === 'Mensal') {
            curDate.setMonth(curDate.getMonth() + 1)
            curEntry.setMonth(curEntry.getMonth() + 1)
          } else if (frequency === 'Trimestral') {
            curDate.setMonth(curDate.getMonth() + 3)
            curEntry.setMonth(curEntry.getMonth() + 3)
          } else if (frequency === 'Anual') {
            curDate.setFullYear(curDate.getFullYear() + 1)
            curEntry.setFullYear(curEntry.getFullYear() + 1)
          }
        }
        addTransactions(txs)
        toast({ title: 'Sucesso', description: `${N} transações recorrentes foram geradas.` })
      } else {
        addTransaction({ ...payload, id: baseId } as Transaction)
        toast({ title: 'Sucesso', description: 'A transação foi salva com sucesso.' })
      }
    }

    setUpdateModeDialogOpen(false)
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isReceitaSubmit = formData.type === 'Receita'

    if (
      !formData.description ||
      formData.amount === undefined ||
      !formData.date ||
      !formData.entryDate ||
      (isReceitaSubmit && !formData.client) ||
      (!isReceitaSubmit && !formData.supplier)
    ) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (transactionToEdit?.recurringGroupId) {
      setUpdateModeDialogOpen(true)
    } else {
      executeSave('single')
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setDisplayAmount(formatted)
    setFormData({ ...formData, amount: parseCurrencyInput(e.target.value) })
  }

  const isReceita = formData.type === 'Receita'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {transactionToEdit
                ? isReceita
                  ? 'Editar Conta a Receber'
                  : 'Editar Conta a Pagar'
                : isReceita
                  ? 'Nova Conta a Receber'
                  : 'Nova Conta a Pagar'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as TransactionType })}
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
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as TransactionStatus })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">{isReceita ? 'Recebido' : 'Pago'}</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">
                  {isReceita ? 'Cliente / Mentorado' : 'Fornecedor'}
                </Label>
                <Input
                  className="h-9 text-sm"
                  required
                  value={(isReceita ? formData.client : formData.supplier) || ''}
                  onChange={(e) =>
                    setFormData(
                      isReceita
                        ? { ...formData, client: e.target.value }
                        : { ...formData, supplier: e.target.value },
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  {isReceita ? 'Tipo de Serviço' : 'Categoria da Despesa'}
                </Label>
                <Select
                  value={isReceita ? formData.service : formData.category}
                  onValueChange={(v) =>
                    setFormData(
                      isReceita ? { ...formData, service: v } : { ...formData, category: v },
                    )
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(isReceita ? services : expenseCategories).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Data de Lançamento</Label>
                <Popover open={entryDateOpen} onOpenChange={setEntryDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-9 text-sm justify-start text-left font-normal',
                        !formData.entryDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.entryDate ? (
                        new Date(formData.entryDate + 'T00:00:00').toLocaleDateString('pt-BR')
                      ) : (
                        <span>Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        formData.entryDate ? new Date(formData.entryDate + 'T00:00:00') : undefined
                      }
                      onSelect={(d) => {
                        if (d) {
                          setFormData({ ...formData, entryDate: d.toISOString().split('T')[0] })
                          setEntryDateOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data de Vencimento</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label className="text-xs">Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Documentos e Anexos
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {formData.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded-md text-xs border"
                  >
                    <span className="truncate max-w-[120px] font-medium" title={att.name}>
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <Label className="cursor-pointer inline-flex items-center justify-center gap-1.5 border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors h-8 px-3 rounded-md text-xs font-medium text-muted-foreground">
                  <Upload className="w-3.5 h-3.5" /> Selecionar Arquivo
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>
            </div>

            {isReceita && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs">Link de Pagamento (Opcional)</Label>
                <Input
                  className="h-9 text-sm"
                  type="url"
                  value={formData.paymentLink || ''}
                  onChange={(e) => setFormData({ ...formData, paymentLink: e.target.value })}
                  placeholder="https://link.pagamento..."
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              Salvar Transação
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={updateModeDialogOpen} onOpenChange={setUpdateModeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar Transação Recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta transação faz parte de uma série recorrente. Você deseja aplicar as alterações
              apenas a esta parcela ou a esta e a todas as futuras?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeSave('single')}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Apenas esta parcela
            </AlertDialogAction>
            <AlertDialogAction onClick={() => executeSave('future')}>
              Esta e as futuras
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
