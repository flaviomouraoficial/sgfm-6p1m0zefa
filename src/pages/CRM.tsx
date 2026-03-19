import { useMemo, useState } from 'react'
import { useMainStore } from '@/stores/main'
import { KanbanCard } from '@/components/crm/KanbanCard'
import { LeadStatus, Lead } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { exportToCSV } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Download, Printer } from 'lucide-react'

const STAGES: LeadStatus[] = [
  'Prospecção',
  'Reunião de Diagnóstico',
  'Geração de Proposta',
  'Apresentação da Proposta',
  'Negociando',
  'Fechado',
  'Perdido',
]

export default function CRM() {
  const { company, companies, leads, banks, services, updateLead, removeLead, addTransaction } =
    useMainStore()
  const [closedLeadId, setClosedLeadId] = useState<string | null>(null)

  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)

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
        bank: banks[0] || 'Caixa',
        service: services[0] || 'Venda',
        performer: 'Eu',
        paymentMethod: 'PIX',
        client: lead.name,
        updatedAt: new Date().toISOString(),
      })
      toast({
        title: 'Lead Fechado!',
        description: 'Previsão adicionada no Financeiro com sucesso.',
      })
    }
    setClosedLeadId(null)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (leadToEdit) {
      updateLead(leadToEdit.id, leadToEdit)
      toast({ title: 'Lead Atualizado', description: 'As informações foram salvas.' })
      setLeadToEdit(null)
    }
  }

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      removeLead(leadToDelete.id)
      toast({ title: 'Lead Removido', description: 'O lead foi excluído com sucesso.' })
      setLeadToDelete(null)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
        <div className="flex items-center space-x-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV('crm_leads.csv', filteredLeads)}
            className="h-9"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 pb-4">
        <div className="flex space-x-4 h-full min-h-[500px]">
          {STAGES.map((stage) => {
            const columnLeads = filteredLeads.filter((l) => l.status === stage)
            return (
              <div
                key={stage}
                className="w-[300px] flex flex-col flex-shrink-0 bg-muted/20 rounded-lg border border-border/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="p-3 border-b border-border/50 flex justify-between items-center bg-card rounded-t-lg shadow-sm">
                  <h3 className="font-semibold text-xs text-foreground/80 tracking-tight uppercase">
                    {stage}
                  </h3>
                  <span className="bg-primary/10 text-primary text-[10px] py-0.5 px-2 rounded-full font-bold">
                    {columnLeads.length}
                  </span>
                </div>
                <ScrollArea className="flex-1 p-2">
                  {columnLeads.map((lead) => (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      onEdit={setLeadToEdit}
                      onDelete={setLeadToDelete}
                    />
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
          <div className="py-4 text-sm">
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
              Apenas mover
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

      <Dialog open={!!leadToEdit} onOpenChange={(open) => !open && setLeadToEdit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {leadToEdit && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Lead</Label>
                <Input
                  id="name"
                  value={leadToEdit.name}
                  onChange={(e) => setLeadToEdit({ ...leadToEdit, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="value">Valor Estimado (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={leadToEdit.value}
                    onChange={(e) =>
                      setLeadToEdit({ ...leadToEdit, value: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Data Alvo</Label>
                  <Input
                    id="date"
                    type="date"
                    value={leadToEdit.targetDate}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, targetDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estágio no Funil</Label>
                <Select
                  value={leadToEdit.status}
                  onValueChange={(val: LeadStatus) => setLeadToEdit({ ...leadToEdit, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    value={leadToEdit.phone}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadToEdit.email}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Empresa Responsável</Label>
                <Select
                  value={leadToEdit.company}
                  onValueChange={(val) => setLeadToEdit({ ...leadToEdit, company: val })}
                >
                  <SelectTrigger>
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
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setLeadToEdit(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.name}</strong>? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
