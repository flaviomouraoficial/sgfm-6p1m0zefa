import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Deal } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { useMainStore } from '@/stores/main'
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
import { Plus, FileText, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STAGES = [
  { id: 'lead', label: 'Leads' },
  { id: 'contact', label: 'Contato Feito' },
  { id: 'proposal', label: 'Proposta' },
  { id: 'won', label: 'Ganho' },
  { id: 'lost', label: 'Perdido' },
] as const

export default function CRM() {
  const { toast } = useToast()
  const { proposals, deals, addDeal, updateDeal, isSyncing } = useMainStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    value: 0,
    stage: 'lead' as Deal['stage'],
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedDeal) {
        await updateDeal(selectedDeal.id, formData)
        toast({ title: 'Sucesso', description: 'Negócio atualizado.' })
      } else {
        await addDeal(formData)
        toast({ title: 'Sucesso', description: 'Negócio criado.' })
      }
      setIsDialogOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar no servidor.', variant: 'destructive' })
    }
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
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-bold text-accent">Funil de Vendas</h1>
        <Button onClick={() => openDeal()} className="bg-primary hover:bg-secondary">
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
              <h3 className="font-semibold text-accent uppercase text-sm mb-3 flex justify-between items-center">
                {stage.label}
                <Badge variant="secondary" className="text-xs bg-white/60 shadow-sm">
                  {deals.filter((d) => d.stage === stage.id).length}
                </Badge>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {deals
                  .filter((d) => d.stage === stage.id)
                  .map((deal) => {
                    const dealProposals = proposals.filter((p) => p.leadId === deal.id)
                    return (
                      <Card
                        key={deal.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm group"
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
                          {dealProposals.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-2 bg-muted/60 w-max px-2 py-0.5 rounded border">
                              <FileText className="w-3 h-3 text-primary" /> {dealProposals.length}{' '}
                              propostas
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{selectedDeal ? 'Detalhes do Negócio' : 'Novo Negócio'}</DialogTitle>
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
            <Button type="submit" className="w-full" disabled={isSyncing}>
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Negócio
            </Button>
          </form>

          {selectedDeal && (
            <div className="pt-4 mt-4 border-t border-border/50 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-primary" /> Propostas Vinculadas
                </span>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-primary text-primary hover:bg-primary/10"
                >
                  <Link to={`/propostas?leadId=${selectedDeal.id}`}>
                    Criar Nova <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {proposals
                  .filter((p) => p.leadId === selectedDeal.id)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center p-2.5 bg-muted/30 rounded-md border text-xs"
                    >
                      <span className="font-medium truncate pr-2">{p.title}</span>
                      <Badge variant="secondary" className="text-[9px] shrink-0 font-normal">
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                {proposals.filter((p) => p.leadId === selectedDeal.id).length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-2 bg-muted/20 rounded">
                    Nenhuma proposta vinculada a este negócio.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
