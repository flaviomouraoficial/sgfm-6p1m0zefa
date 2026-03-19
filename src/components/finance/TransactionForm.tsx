import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Transaction, TransactionType, TransactionStatus } from '@/lib/types'
import { useMainStore } from '@/stores/main'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultType: TransactionType
  transactionToEdit?: Transaction | null
}

export function TransactionForm({ open, onOpenChange, defaultType, transactionToEdit }: Props) {
  const {
    addTransaction,
    updateTransaction,
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
    entryDate: new Date().toISOString().split('T')[0],
  })

  const [displayAmount, setDisplayAmount] = useState('')

  useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        setFormData(transactionToEdit)
        setDisplayAmount(formatCurrencyInput(Math.round(transactionToEdit.amount * 100).toString()))
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
          status: 'Pendente',
        }))
        setDisplayAmount('')
      }
    }
  }, [open, defaultType, transactionToEdit])

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
        description:
          'Por favor, preencha todos os campos obrigatórios (incluindo Cliente/Fornecedor).',
        variant: 'destructive',
      })
      return
    }

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        ...formData,
        amount: Number(formData.amount),
      } as Transaction)
      toast({
        title: 'Sucesso',
        description: 'Os dados da transação foram atualizados com sucesso.',
      })
    } else {
      addTransaction({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        amount: Number(formData.amount),
      } as Transaction)
      toast({
        title: 'Sucesso',
        description: 'A nova transação foi registrada com sucesso.',
      })
    }

    onOpenChange(false)
    if (!transactionToEdit) {
      setFormData((prev) => ({
        ...prev,
        description: '',
        amount: undefined,
        date: '',
        entryDate: new Date().toISOString().split('T')[0],
        client: '',
        supplier: '',
      }))
      setDisplayAmount('')
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setDisplayAmount(formatted)
    setFormData({ ...formData, amount: parseCurrencyInput(e.target.value) })
  }

  const isReceita = formData.type === 'Receita'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                onValueChange={(v) => setFormData({ ...formData, status: v as TransactionStatus })}
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
              <Label className="text-xs">{isReceita ? 'Cliente / Mentorado' : 'Fornecedor'}</Label>
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
              <Input
                className="h-9 text-sm"
                type="date"
                required
                value={formData.entryDate || ''}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Data de Vencimento</Label>
              <Input
                className="h-9 text-sm"
                type="date"
                required
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Valor</Label>
              <Input
                className="h-9 text-sm"
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

          <Button
            type="submit"
            className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            Salvar Transação
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
