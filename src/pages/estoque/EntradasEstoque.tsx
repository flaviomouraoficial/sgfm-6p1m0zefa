import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowDownLeft, Plus, Search, FileText, Calendar, Boxes } from 'lucide-react'
import { estoqueService } from '@/services/estoque'
import { Produto, EstoqueMovimentacao } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useMainStore } from '@/stores/main'
import { formatCurrency } from '@/lib/utils'

export function EntradasEstoquePage() {
  const { toast } = useToast()
  const { selectedEmpresaId, empresas } = useMainStore()
  const [entradas, setEntradas] = useState<EstoqueMovimentacao[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    produto_id: '',
    quantidade: 1,
    custo_unitario: 0,
    nf_numero: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
    empresa_id: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [movList, prodList] = await Promise.all([
        estoqueService.listMovimentacoes(selectedEmpresaId),
        estoqueService.listProdutos(selectedEmpresaId),
      ])
      // Apenas entradas ou ajustes positivos
      setEntradas(movList.filter((m) => m.tipo === 'entrada'))
      setProdutos(prodList)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as entradas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedEmpresaId])

  const handleOpenCreate = () => {
    const defaultEmpresaId =
      selectedEmpresaId !== 'todas'
        ? selectedEmpresaId
        : empresas.find((e) => e.is_principal)?.id || empresas[0]?.id || ''

    setForm({
      produto_id: produtos[0]?.id || '',
      quantidade: 10,
      custo_unitario: produtos[0]?.preco_compra || 0,
      nf_numero: '',
      data: new Date().toISOString().split('T')[0],
      observacao: 'Reposição de estoque / Compra de fornecedor',
      empresa_id: defaultEmpresaId,
    })
    setDialogOpen(true)
  }

  const handleProdutoChange = (prodId: string) => {
    const prod = produtos.find((p) => p.id === prodId)
    setForm((f) => ({
      ...f,
      produto_id: prodId,
      custo_unitario: prod?.preco_compra || 0,
    }))
  }

  const handleSave = async () => {
    if (!form.produto_id || Number(form.quantidade) <= 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione um produto e informe quantidade válida.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      await estoqueService.registrarEntrada(form)
      toast({
        title: 'Entrada Registrada',
        description: 'O estoque do produto foi atualizado com sucesso!',
      })
      setDialogOpen(false)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar entrada',
        description: err.message || 'Falha ao salvar movimentação.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const totalQuantidade = entradas.reduce((acc, e) => acc + (Number(e.quantidade) || 0), 0)
  const totalValor = entradas.reduce((acc, e) => acc + (Number(e.valor_total) || 0), 0)

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent flex items-center gap-2">
            <ArrowDownLeft className="w-8 h-8 text-emerald-600" /> Entradas de Estoque (Compras)
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro de reposição de mercadoria, custo unitário e número da nota fiscal de compra.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" /> Registrar Entrada
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardDescription className="text-xs uppercase font-medium">
              Registros de Entrada
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{entradas.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardDescription className="text-xs uppercase font-medium">
              Itens Recebidos
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {totalQuantidade} un
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardDescription className="text-xs uppercase font-medium">
              Valor Total Investido
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {formatCurrency(totalValor)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Histórico de Entradas</CardTitle>
            <div className="text-xs text-muted-foreground">
              Empresa:{' '}
              <strong>{selectedEmpresaId === 'todas' ? 'Todas' : 'CNPJ Selecionado'}</strong>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4 text-center">NF Compra</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                  <th className="py-3 px-4 text-right">Custo Unitário</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Carregando movimentações...
                    </td>
                  </tr>
                ) : entradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhuma entrada de estoque registrada para este CNPJ.
                    </td>
                  </tr>
                ) : (
                  entradas.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {e.data ? new Date(e.data).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {e.expand?.produto_id?.nome || 'Produto'}
                        {e.expand?.produto_id?.codigo && (
                          <span className="text-xs font-mono text-primary ml-2">
                            ({e.expand.produto_id.codigo})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {e.nf_numero ? (
                          <Badge variant="outline" className="font-mono text-[11px]">
                            NF {e.nf_numero}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 font-mono">
                        +{e.quantidade}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        {formatCurrency(Number(e.custo_unitario) || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(Number(e.valor_total) || 0)}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {e.observacao || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Nova Entrada */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="space-y-1">
              <Label>Produto / Livro *</Label>
              <select
                value={form.produto_id}
                onChange={(e) => handleProdutoChange(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nome} (Estoque atual: {p.estoque_atual})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>Custo Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.custo_unitario}
                  onChange={(e) => setForm({ ...form, custo_unitario: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nº Nota Fiscal (Ref.)</Label>
                <Input
                  value={form.nf_numero}
                  onChange={(e) => setForm({ ...form, nf_numero: e.target.value })}
                  placeholder="Ex: 001.234"
                />
                <span className="text-[10px] text-muted-foreground leading-none">
                  Apenas registro externo (sem emissão).
                </span>
              </div>
              <div className="space-y-1">
                <Label>Data de Entrada *</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Empresa (CNPJ)</Label>
              <select
                value={form.empresa_id}
                onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome} ({emp.cnpj})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Observações</Label>
              <Input
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                placeholder="Fornecedor, motivo de ajuste, etc."
              />
            </div>

            <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Valor Total da Entrada:</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(
                  (Number(form.quantidade) || 0) * (Number(form.custo_unitario) || 0),
                )}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Registrando...' : 'Confirmar Entrada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
