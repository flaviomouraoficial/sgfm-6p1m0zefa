import { useEffect, useState } from 'react'
import { cloudApi } from '@/lib/cloudApi'
import { Deal } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STAGES = [
  { id: 'lead', label: 'Leads' },
  { id: 'contact', label: 'Contato Feito' },
  { id: 'proposal', label: 'Proposta' },
  { id: 'won', label: 'Ganho' },
  { id: 'lost', label: 'Perdido' },
] as const

export default function CRM() {
  const { toast } = useToast()
  const [deals, setDeals] = useState<Deal[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    value: 0,
    stage: 'lead' as Deal['stage'],
  })

  const loadDeals = async () => {
    const data = await cloudApi.deals.list()
    setDeals(data)
  }

  useEffect(() => {
    loadDeals()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDeal) {
      await cloudApi.deals.update(selectedDeal.id, formData)
      toast({ title: 'Sucesso', description: 'Negócio atualizado.' })
    } else {
      await cloudApi.deals.create(formData)
      toast({ title: 'Sucesso', description: 'Negócio criado.' })
    }
    setIsDialogOpen(false)
    loadDeals()
  }

  const openDeal = (deal?: Deal) => {
    if (deal) {
      setSelectedDeal(deal)
      setFormData({
        title: deal.title,
        clientName: deal.clientName,
        value: deal.value,
        stage: deal.stage,
      })
    } else {
      setSelectedDeal(null)
      setFormData({ title: '', clientName: '', value: 0, stage: 'lead' })
    }
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-bold text-accent">Funil de Vendas</h1>
        <Button
          onClick={() => openDeal()}
          className="bg-primary hover:bg-secondary text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Negócio
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col w-72 bg-muted/40 rounded-lg p-3 shrink-0 border border-border/50"
            >
              <h3 className="font-semibold text-accent uppercase text-sm mb-3 flex justify-between">
                {stage.label}
                <span className="text-xs bg-white px-2 py-0.5 rounded-full shadow-sm">
                  {deals.filter((d) => d.stage === stage.id).length}
                </span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {deals
                  .filter((d) => d.stage === stage.id)
                  .map((deal) => (
                    <Card
                      key={deal.id}
                      className="cursor-pointer hover:border-secondary/50 transition-colors shadow-sm"
                      onClick={() => openDeal(deal)}
                    >
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium">{deal.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        <p className="text-xs text-muted-foreground">{deal.clientName}</p>
                        <p className="text-sm font-bold text-primary mt-1">
                          {formatCurrency(deal.value)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDeal ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              placeholder="Título da Oportunidade"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Input
              placeholder="Nome do Cliente"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              required
            />
            <Input
              type="number"
              placeholder="Valor (R$)"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              required
            />
            <Select
              value={formData.stage}
              onValueChange={(v: Deal['stage']) => setFormData({ ...formData, stage: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estágio" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-secondary text-primary-foreground"
            >
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
