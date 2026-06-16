import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Deal } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { useMainStore } from '@/stores/main'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  FileText,
  ExternalLink,
  RefreshCw,
  Edit,
  Trash2,
  FilterX,
  PieChart,
  LayoutGrid,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STAGES = [
  { id: 'lead', label: 'Leads', color: 'border-slate-400' },
  { id: 'contact', label: 'Contato Feito', color: 'border-blue-500' },
  { id: 'proposal', label: 'Proposta', color: 'border-amber-500' },
  { id: 'won', label: 'Ganho', color: 'border-primary' },
  { id: 'lost', label: 'Perdido', color: 'border-destructive' },
] as const

export default function CRM() {
  const { toast } = useToast()
  const { proposals, deals, addDeal, updateDeal, removeDeal, isSyncing } = useMainStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    value: 0,
    stage: 'lead' as Deal['stage'],
    phone: '',
    email: '',
    notes: '',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'kanban'
  const filteredStage = searchParams.get('stage') || null

  const setActiveTab = (v: string) => {
    setSearchParams(
      (prev) => {
        prev.set('tab', v)
        return prev
      },
      { replace: true },
    )
  }

  const setFilteredStage = (v: string | null) => {
    setSearchParams(
      (prev) => {
        if (v) prev.set('stage', v)
        else prev.delete('stage')
        return prev
      },
      { replace: true },
    )
  }

  const chartData = STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage.id)
    const count = stageDeals.length
    const value = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0)
    return {
      name: stage.label,
      id: stage.id,
      count,
      value,
      color:
        stage.color === 'border-primary'
          ? 'hsl(var(--primary))'
          : stage.color === 'border-destructive'
            ? 'hsl(var(--destructive))'
            : stage.color === 'border-slate-400'
              ? '#94a3b8'
              : stage.color === 'border-blue-500'
                ? '#3b82f6'
                : stage.color === 'border-amber-500'
                  ? '#f59e0b'
                  : 'hsl(var(--primary))',
    }
  })

  const handleStageClick = (stageId: string) => {
    setFilteredStage(stageId)
    setActiveTab('kanban')
  }

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
        phone: deal.phone || '',
        email: deal.email || '',
        notes: deal.notes || '',
      })
    } else {
      setSelectedDeal(null)
      setFormData({
        title: '',
        clientName: '',
        value: 0,
        stage: 'lead',
        phone: '',
        email: '',
        notes: '',
      })
    }
    setIsDialogOpen(true)
  }

  const confirmDeleteDeal = async () => {
    if (dealToDelete) {
      try {
        await removeDeal(dealToDelete.id)
        toast({ title: 'Excluído', description: 'Negócio removido com sucesso.' })
        setIsDialogOpen(false)
        setDealToDelete(null)
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
      }
    }
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-accent">Funil de Vendas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas oportunidades de consultoria.</p>
        </div>
        <div className="flex gap-2">
          {filteredStage && (
            <Button
              variant="outline"
              onClick={() => setFilteredStage(null)}
              className="text-muted-foreground bg-white"
            >
              <FilterX className="mr-2 h-4 w-4" /> Limpar Filtro
            </Button>
          )}
          <Button onClick={() => openDeal()} className="bg-primary hover:bg-secondary">
            <Plus className="mr-2 h-4 w-4" /> Novo Negócio
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <TabsList>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Dashboard de Funil
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 overflow-y-auto m-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades por Estágio</CardTitle>
                <CardDescription>Quantidade de negócios em cada fase do funil</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ count: { label: 'Quantidade', color: 'hsl(var(--primary))' } }}
                  className="h-[320px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={true}
                        opacity={0.2}
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={{ fill: 'transparent' }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="count"
                        radius={[0, 4, 4, 0]}
                        className="cursor-pointer"
                        onClick={(data: any) => data && data.id && handleStageClick(data.id)}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="count" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valor Projetado por Estágio</CardTitle>
                <CardDescription>Total financeiro (R$) em cada fase do funil</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ value: { label: 'Valor', color: 'hsl(var(--primary))' } }}
                  className="h-[320px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 20, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis hide />
                      <ChartTooltip
                        cursor={{ fill: 'transparent' }}
                        content={
                          <ChartTooltipContent
                            formatter={(value) => formatCurrency(value as number)}
                          />
                        }
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        className="cursor-pointer"
                        onClick={(data: any) => data && data.id && handleStageClick(data.id)}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          formatter={(val: number) => formatCurrency(val)}
                          style={{ fontSize: '10px' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="kanban"
          className="flex-1 overflow-x-auto overflow-y-hidden m-0 data-[state=active]:flex flex-col"
        >
          <div className="flex gap-4 h-full min-w-max pb-4 flex-1">
            {STAGES.filter((s) => !filteredStage || s.id === filteredStage).map((stage) => (
              <div
                key={stage.id}
                className={cn(
                  'flex flex-col bg-muted/40 rounded-lg p-3 shrink-0 border-t-4 shadow-sm',
                  filteredStage ? 'w-full max-w-3xl' : 'w-72',
                  stage.color,
                )}
              >
                <h3 className="font-semibold text-foreground uppercase text-sm mb-3 flex justify-between items-center">
                  {stage.label}
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white shadow-sm border border-border"
                  >
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
                          className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 shadow-sm group relative bg-card"
                          onClick={() => openDeal(deal)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeal(deal)
                            }}
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <CardHeader className="p-3 pb-0 pr-10">
                            <CardTitle className="text-sm font-medium leading-tight">
                              {deal.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-2">
                            <p className="text-xs text-muted-foreground">{deal.clientName}</p>
                            <p className="text-sm font-bold text-primary mt-1">
                              {formatCurrency(deal.value)}
                            </p>
                            {dealProposals.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] text-primary-foreground font-medium mt-2 bg-primary/90 w-max px-2 py-0.5 rounded border border-primary">
                                <FileText className="w-3 h-3" /> {dealProposals.length} propostas
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  {deals.filter((d) => d.stage === stage.id).length === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-lg text-center text-xs text-muted-foreground opacity-50">
                      Nenhum negócio
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] overflow-y-auto max-h-[90vh]">
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Telefone / WhatsApp"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                type="email"
                placeholder="E-mail"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
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
            <Textarea
              placeholder="Anotações e observações..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="resize-none h-24"
            />
            <div className="flex justify-between items-center w-full pt-2">
              {selectedDeal ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDealToDelete(selectedDeal)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </Button>
              ) : (
                <div></div>
              )}
              <Button type="submit" disabled={isSyncing} className={!selectedDeal ? 'w-full' : ''}>
                {isSyncing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Negócio
              </Button>
            </div>
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
                  <Link to={`/admin/propostas?leadId=${selectedDeal.id}`}>
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

      <AlertDialog open={!!dealToDelete} onOpenChange={(open) => !open && setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Negócio?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o negócio "{dealToDelete?.title}"? As propostas
              vinculadas a ele ficarão órfãs. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDeal}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
