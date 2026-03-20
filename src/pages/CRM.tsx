import { useMemo, useState, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { KanbanCard } from '@/components/crm/KanbanCard'
import { LeadStatus, Lead, Mentee } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { exportToCSV } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Download, Printer, Plus, RefreshCw } from 'lucide-react'

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
  const {
    company,
    companies,
    leads,
    banks,
    services,
    addLead,
    updateLead,
    removeLead,
    addTransaction,
    addMentee,
    isInitialLoad,
    syncData,
    isSyncing,
  } = useMainStore()

  const [closedLeadId, setClosedLeadId] = useState<string | null>(null)

  const [isAddingLead, setIsAddingLead] = useState(false)
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    value: 0,
    targetDate: new Date().toISOString().split('T')[0],
    status: 'Prospecção',
    phone: '',
    email: '',
    company: companies[0] || 'Grupo Flávio Moura',
  })

  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)

  const [period, setPeriod] = useState<'all' | 'month' | 'week' | 'day'>('all')

  useEffect(() => {
    syncData()
  }, [syncData])

  const filteredLeads = useMemo(() => {
    let res = company === 'Todas' ? leads : leads.filter((l) => l.company === company)

    if (period !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let start = new Date(today)
      let end = new Date(today)
      end.setHours(23, 59, 59, 999)

      if (period === 'week') {
        start.setDate(today.getDate() - today.getDay())
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
      } else if (period === 'month') {
        start.setDate(1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      }

      res = res.filter((l) => {
        if (!l.targetDate) return false
        const d = new Date(l.targetDate + 'T00:00:00')
        return d >= start && d <= end
      })
    }

    return res
  }, [company, leads, period])

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

  const confirmFechado = async () => {
    if (!closedLeadId) return
    const lead = leads.find((l) => l.id === closedLeadId)
    if (lead) {
      await updateLead(closedLeadId, { status: 'Fechado' })
      await addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        description: `Venda CRM - ${lead.name}`,
        amount: lead.value,
        date: new Date().toISOString().split('T')[0],
        entryDate: new Date().toISOString().split('T')[0],
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

      await addMentee({
        id: Math.random().toString(36).substr(2, 9),
        name: lead.name,
        company: lead.company,
        contractValue: lead.value,
        totalSessions: 10,
        status: 'Ativo',
        phone: lead.phone,
        email: lead.email,
        sessions: [],
        emailLogs: [],
      } as Mentee)

      toast({
        title: 'Lead Fechado!',
        description: 'Previsão financeira e perfil de mentoria criados com sucesso.',
      })
    }
    setClosedLeadId(null)
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newLead.name) {
      await addLead({
        ...newLead,
        id: Math.random().toString(36).substr(2, 9),
      } as Lead)
      toast({ title: 'Sucesso', description: 'Novo negócio adicionado ao funil.' })
      setIsAddingLead(false)
      setNewLead({
        name: '',
        value: 0,
        targetDate: new Date().toISOString().split('T')[0],
        status: 'Prospecção',
        phone: '',
        email: '',
        company: companies[0] || 'Grupo Flávio Moura',
      })
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (leadToEdit) {
      await updateLead(leadToEdit.id, leadToEdit)
      toast({ title: 'Lead Atualizado', description: 'As informações foram salvas.' })
      setLeadToEdit(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (leadToDelete) {
      await removeLead(leadToDelete.id)
      toast({ title: 'Lead Removido', description: 'O lead foi excluído com sucesso.' })
      setLeadToDelete(null)
    }
  }

  if (isInitialLoad) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex space-x-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-[300px] h-[500px] shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-background shadow-sm">
              <SelectValue placeholder="Período Alvo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o Período</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="day">Hoje</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 print:hidden flex-wrap gap-y-2">
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
          <Button
            onClick={() => setIsAddingLead(true)}
            className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Negócio
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
                  {columnLeads.length === 0 && (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-border/50 rounded-md m-2 opacity-50">
                      <span className="text-xs text-muted-foreground text-center">Soltar aqui</span>
                    </div>
                  )}
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
            Deseja gerar automaticamente a previsão de recebimento no módulo Financeiro e criar o
            perfil de Mentorado?
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (closedLeadId) updateLead(closedLeadId, { status: 'Fechado' })
                setClosedLeadId(null)
              }}
              disabled={isSyncing}
            >
              Apenas mover
            </Button>
            <Button
              onClick={confirmFechado}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSyncing}
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Gerar Recebimento e Mentoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingLead} onOpenChange={setIsAddingLead}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Negócio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">Nome do Lead</Label>
              <Input
                id="new-name"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-value">Valor Estimado (R$)</Label>
                <Input
                  id="new-value"
                  type="number"
                  step="0.01"
                  value={newLead.value}
                  onChange={(e) => setNewLead({ ...newLead, value: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-date">Data Alvo</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newLead.targetDate}
                  onChange={(e) => setNewLead({ ...newLead, targetDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-status">Estágio no Funil</Label>
              <Select
                value={newLead.status}
                onValueChange={(val: LeadStatus) => setNewLead({ ...newLead, status: val })}
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
                <Label htmlFor="new-phone">WhatsApp</Label>
                <Input
                  id="new-phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-email">E-mail</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-company">Empresa Responsável</Label>
              <Select
                value={newLead.company}
                onValueChange={(val) => setNewLead({ ...newLead, company: val })}
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
              <Button type="button" variant="outline" onClick={() => setIsAddingLead(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSyncing}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Criar Lead
              </Button>
            </DialogFooter>
          </form>
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
                <Label htmlFor="edit-name">Nome do Lead</Label>
                <Input
                  id="edit-name"
                  value={leadToEdit.name}
                  onChange={(e) => setLeadToEdit({ ...leadToEdit, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-value">Valor Estimado (R$)</Label>
                  <Input
                    id="edit-value"
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
                  <Label htmlFor="edit-date">Data Alvo</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={leadToEdit.targetDate}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, targetDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Estágio no Funil</Label>
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
                  <Label htmlFor="edit-phone">WhatsApp</Label>
                  <Input
                    id="edit-phone"
                    value={leadToEdit.phone}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={leadToEdit.email}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company">Empresa Responsável</Label>
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
                <Button type="submit" disabled={isSyncing}>
                  {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
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
              disabled={isSyncing}
            >
              {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
