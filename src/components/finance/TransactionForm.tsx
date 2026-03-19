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
  const { addTransaction } = useMainStore()
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'Receita',
    status: 'Pendente',
    company: 'Grupo Flávio Moura',
    bank: 'Banco Itaú',
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
      company: 'Grupo Flávio Moura',
      bank: 'Banco Itaú',
      performer: 'Eu',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as any })}
              >
                <SelectTrigger>
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
            <Label>Descrição</Label>
            <Input
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value as any })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                required
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={formData.company}
                onValueChange={(v) => setFormData({ ...formData, company: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grupo Flávio Moura">Grupo Flávio Moura</SelectItem>
                  <SelectItem value="FM Academy">FM Academy</SelectItem>
                  <SelectItem value="FM Consultoria">FM Consultoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select
                value={formData.bank}
                onValueChange={(v) => setFormData({ ...formData, bank: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Banco Itaú">Banco Itaú</SelectItem>
                  <SelectItem value="Banco Nubank">Banco Nubank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4">
            Salvar Transação
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
