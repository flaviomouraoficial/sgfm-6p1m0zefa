import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMainStore } from '@/stores/main'
import { cloudApi } from '@/lib/cloudApi'
import { Proposal, Deal, ProposalStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, cn } from '@/lib/utils'
import { Plus, Edit, Trash2, FileText, Calendar as CalendarIcon } from 'lucide-react'

const STATUSES: ProposalStatus[] = ['Rascunho', 'Enviada', 'Aceita', 'Rejeitada']

export default function Propostas() {
  const { proposals, addProposal, updateProposal, removeProposal } = useMainStore()
  const [deals, setDeals] = useState<Deal[]>([])
  const [searchParams] = useSearchParams()
  const leadIdParam = searchParams.get('leadId')

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Proposal>>({ status: 'Rascunho' })
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    cloudApi.deals.list().then(setDeals)
  }, [])

  useEffect(() => {
    if (leadIdParam) {
      setFormData({ leadId: leadIdParam, status: 'Rascunho' })
      setIsOpen(true)
    }
  }, [leadIdParam])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...formData, value: parseCurrencyInput(displayValue) } as Proposal
    if (editingId) updateProposal(editingId, payload)
    else
      addProposal({
        ...payload,
        id: Math.random().toString(36).substring(2),
        createdAt: new Date().toISOString(),
      })
    setIsOpen(false)
  }

  const openEdit = (p: Proposal) => {
    setEditingId(p.id)
    setFormData(p)
    setDisplayValue(formatCurrencyInput((p.value * 100).toString()))
    setIsOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent">Controle de Propostas</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie propostas comerciais vinculadas ao Funil de Vendas.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setFormData({ status: 'Rascunho' })
            setDisplayValue('')
            setIsOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Proposta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {proposals.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-muted/30 border border-dashed rounded-lg text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            Nenhuma proposta cadastrada ainda.
          </div>
        ) : (
          proposals.map((p) => {
            const deal = deals.find((d) => d.id === p.leadId)
            return (
              <Card
                key={p.id}
                className="shadow-sm hover:shadow-md transition-shadow group border-l-4 border-l-primary"
              >
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
                      {p.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 truncate">
                      {deal?.clientName || 'Lead Desconhecido'}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-2 font-medium bg-background',
                      p.status === 'Aceita'
                        ? 'border-green-500 text-green-600'
                        : p.status === 'Rejeitada'
                          ? 'border-destructive text-destructive'
                          : p.status === 'Enviada'
                            ? 'border-blue-400 text-blue-600'
                            : '',
                    )}
                  >
                    {p.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between font-bold text-primary bg-primary/5 p-2 rounded-md">
                    <span>Total</span>
                    <span>{formatCurrency(p.value)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" /> Validade:{' '}
                    {new Date(p.expirationDate).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="pt-3 flex justify-end gap-1 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEdit(p)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      onClick={() => removeProposal(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <Input
              placeholder="Título da Proposta (ex: Consultoria Estratégica)"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Select
              value={formData.leadId}
              onValueChange={(v) => setFormData({ ...formData, leadId: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Lead vinculado" />
              </SelectTrigger>
              <SelectContent>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title} ({d.clientName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Valor Total (R$)"
                required
                value={displayValue}
                onChange={(e) => setDisplayValue(formatCurrencyInput(e.target.value))}
              />
              <Input
                type="date"
                required
                value={formData.expirationDate || ''}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                title="Data de Validade"
              />
            </div>
            <Input
              placeholder="Descrição ou Observações Breves"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as ProposalStatus })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status da Proposta" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full h-11 text-base font-semibold">
              Salvar Proposta
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
