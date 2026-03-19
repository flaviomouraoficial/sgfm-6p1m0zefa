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
import { Transaction, TransactionType } from '@/lib/types'
import { useMainStore } from '@/stores/main'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultType: TransactionType
}

export function TransactionForm({ open, onOpenChange, defaultType }: Props) {
  const { addTransaction, companies, banks, services, expenseCategories, paymentMethods } =
    useMainStore()

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
  })

  useEffect(() => {
    if (open) setFormData((prev) => ({ ...prev, type: defaultType }))
  }, [open, defaultType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount || !formData.date) return

    addTransaction({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      amount: Number(formData.amount),
    } as Transaction)

    onOpenChange(false)
    setFormData((prev) => ({
      ...prev,
      description: '',
      amount: undefined,
      date: '',
      client: '',
      supplier: '',
    }))
  }

  const isReceita = formData.type === 'Receita'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isReceita ? 'Nova Conta a Receber' : 'Nova Conta a Pagar'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as any })}
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
                onValueChange={(v) => setFormData({ ...formData, status: v as any })}
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                className="h-9 text-sm"
                type="number"
                step="0.01"
                required
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value as any })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Vencimento</Label>
              <Input
                className="h-9 text-sm"
                type="date"
                required
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
