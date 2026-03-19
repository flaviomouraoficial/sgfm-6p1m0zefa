import { useState } from 'react'
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
import { Transaction } from '@/lib/types'
import { useMainStore } from '@/stores/main'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function TransactionForm({ open, onOpenChange }: Props) {
  const { addTransaction, companies, banks, services } = useMainStore()

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'Receita',
    status: 'Pendente',
    company: companies[0] || '',
    bank: banks[0] || '',
    service: services[0] || '',
    performer: 'Eu',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount || !formData.date) return

    addTransaction({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      amount: Number(formData.amount),
    } as Transaction)

    onOpenChange(false)
    setFormData({
      type: 'Receita',
      status: 'Pendente',
      company: companies[0] || '',
      bank: banks[0] || '',
      service: services[0] || '',
      performer: 'Eu',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label className="text-xs">Empresa</Label>
              <Select
                value={formData.company}
                onValueChange={(v) => setFormData({ ...formData, company: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Banco</Label>
              <Select
                value={formData.bank}
                onValueChange={(v) => setFormData({ ...formData, bank: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Serviço Referente</Label>
              <Select
                value={formData.service}
                onValueChange={(v) => setFormData({ ...formData, service: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Executado por</Label>
              <Select
                value={formData.performer}
                onValueChange={(v) => setFormData({ ...formData, performer: v as any })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eu">Eu mesmo</SelectItem>
                  <SelectItem value="Terceiro">Terceiro</SelectItem>
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
