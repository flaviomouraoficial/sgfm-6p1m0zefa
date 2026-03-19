import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { KanbanCard } from '@/components/crm/KanbanCard'
import { LeadStatus } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const STAGES: LeadStatus[] = [
  'Prospecção',
  'Diagnóstico',
  'Proposta',
  'Apresentação',
  'Negociando',
  'Fechado',
  'Perdido',
]

export default function CRM() {
  const { company, leads, updateLead, addTransaction } = useMainStore()
  const [closedLeadId, setClosedLeadId] = useState<string | null>(null)

  const filteredLeads = useMemo(
    () => (company === 'Todas' ? leads : leads.filter((l) => l.company === company)),
    [company, leads],
  )

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('leadId')
    if (!id) return

    if (status === 'Fechado') {
      setClosedLeadId(id)
    } else {
      updateLead(id, { status })
    }
  }

  const confirmFechado = () => {
    if (!closedLeadId) return
    const lead = leads.find((l) => l.id === closedLeadId)
    if (lead) {
      updateLead(closedLeadId, { status: 'Fechado' })
      addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        description: `Venda CRM - ${lead.name}`,
        amount: lead.value,
        date: new Date().toISOString().split('T')[0],
        type: 'Receita',
        status: 'Pendente',
        company: lead.company,
        bank: 'Banco Itaú',
        performer: 'Eu',
      })
      toast({
        title: 'Lead Fechado!',
        description: 'Previsão adicionada no Financeiro com sucesso.',
      })
    }
    setClosedLeadId(null)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
      </div>

      <ScrollArea className="flex-1 pb-4">
        <div className="flex space-x-4 h-full min-h-[500px]">
          {STAGES.map((stage) => {
            const columnLeads = filteredLeads.filter((l) => l.status === stage)
            return (
              <div
                key={stage}
                className="w-80 flex flex-col flex-shrink-0 bg-muted/30 rounded-lg border border-border/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="p-3 border-b border-border/50 flex justify-between items-center bg-card rounded-t-lg">
                  <h3 className="font-semibold text-sm">{stage}</h3>
                  <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full font-bold">
                    {columnLeads.length}
                  </span>
                </div>
                <ScrollArea className="flex-1 p-3">
                  {columnLeads.map((lead) => (
                    <KanbanCard key={lead.id} lead={lead} />
                  ))}
                </ScrollArea>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog open={!!closedLeadId} onOpenChange={() => setClosedLeadId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parabéns pelo fechamento!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Deseja gerar automaticamente a previsão de recebimento no módulo Financeiro?
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (closedLeadId) updateLead(closedLeadId, { status: 'Fechado' })
                setClosedLeadId(null)
              }}
            >
              Apenas mover lead
            </Button>
            <Button
              onClick={confirmFechado}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Gerar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
