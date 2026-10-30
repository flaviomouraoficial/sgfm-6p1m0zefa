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
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react'
import { estoqueService } from '@/services/estoque'
import { Produto } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useMainStore } from '@/stores/main'
import { formatCurrency } from '@/lib/utils'

export function ProdutosPage() {
  const { toast } = useToast()
  const { selectedEmpresaId, empresas } = useMainStore()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Partial<Produto> | null>(null)
  const [saving, setSaving] = useState(false)

  const loadProdutos = async () => {
    try {
      setLoading(true)
      const list = await estoqueService.listProdutos(selectedEmpresaId)
      setProdutos(list)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProdutos()
  }, [selectedEmpresaId])

  const handleOpenCreate = async () => {
    const defaultEmpresaId =
      selectedEmpresaId !== 'todas'
        ? selectedEmpresaId
        : empresas.find((e) => e.is_principal)?.id || empresas[0]?.id || ''
    const nextCodigo = await estoqueService.gerarProximoCodigo()

    setEditingProduto({
      codigo: nextCodigo,
      nome: '',
      descricao: '',
      ano_publicacao: new Date().getFullYear(),
      preco_compra: 0,
      preco_venda: 0,
      estoque_atual: 0,
      estoque_minimo: 5,
      unidade_medida: 'UN',
      categoria: 'Livros',
      empresa_id: defaultEmpresaId,
      ativo: true,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (prod: Produto) => {
    setEditingProduto({ ...prod })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingProduto?.nome || !editingProduto?.preco_venda) {
      toast({
        title: 'Atenção',
        description: 'Nome e Preço de Venda são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      if (editingProduto.id) {
        await estoqueService.updateProduto(editingProduto.id, editingProduto)
        toast({ title: 'Sucesso', description: 'Produto atualizado com sucesso!' })
      } else {
        await estoqueService.createProduto(editingProduto)
        toast({ title: 'Sucesso', description: 'Produto cadastrado com sucesso!' })
      }
      setDialogOpen(false)
      loadProdutos()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha ao salvar produto.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      try {
        await estoqueService.deleteProduto(id)
        toast({ title: 'Excluído', description: 'Produto removido com sucesso.' })
        loadProdutos()
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao excluir produto.', variant: 'destructive' })
      }
    }
  }

  const filteredProdutos = produtos.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.nome?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q)
    )
  })

  // Cálculo da margem em tempo real no formulário
  const precoCompra = Number(editingProduto?.preco_compra) || 0
  const precoVenda = Number(editingProduto?.preco_venda) || 0
  const lucroBruto = precoVenda - precoCompra
  const margemPercentual = precoVenda > 0 ? ((lucroBruto / precoVenda) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> Produtos & Livros
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastro de livros, materiais didáticos e controle de catálogo com código gerado
            automaticamente.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Novo Produto
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Total: <strong>{filteredProdutos.length}</strong> produto(s)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Produto / Descrição</th>
                  <th className="py-3 px-4">Ano</th>
                  <th className="py-3 px-4 text-right">Preço Compra</th>
                  <th className="py-3 px-4 text-right">Preço Venda</th>
                  <th className="py-3 px-4 text-right">Margem</th>
                  <th className="py-3 px-4 text-center">Estoque</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filteredProdutos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      Nenhum produto cadastrado para o CNPJ selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredProdutos.map((p) => {
                    const pc = Number(p.preco_compra) || 0
                    const pv = Number(p.preco_venda) || 0
                    const lucro = pv - pc
                    const margem = pv > 0 ? ((lucro / pv) * 100).toFixed(1) : '0.0'
                    const isEstoqueBaixo = (p.estoque_atual || 0) <= (p.estoque_minimo || 0)

                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-primary">
                          {p.codigo}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{p.nome}</div>
                          {p.descricao && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {p.descricao}
                            </div>
                          )}
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Cat: {p.categoria || 'Geral'} | Unidade: {p.unidade_medida || 'UN'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {p.ano_publicacao || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {formatCurrency(pc)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                          {formatCurrency(pv)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <Badge
                            variant={Number(margem) >= 40 ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {margem}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 font-bold font-mono">
                            {p.estoque_atual || 0}
                            {isEstoqueBaixo && (
                              <span title="Estoque no limite ou abaixo do mínimo!">
                                <AlertTriangle className="w-4 h-4 text-amber-500 inline" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            Mín: {p.estoque_minimo || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={p.ativo ? 'outline' : 'secondary'}
                            className="text-[10px]"
                          >
                            {p.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Cadastro/Edição de Produto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduto?.id ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Código * (Automático)</Label>
                <Input
                  value={editingProduto?.codigo || ''}
                  onChange={(e) => setEditingProduto({ ...editingProduto, codigo: e.target.value })}
                  placeholder="PRD-25-0001"
                  className="font-mono uppercase font-semibold"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Nome do Produto / Livro *</Label>
                <Input
                  value={editingProduto?.nome || ''}
                  onChange={(e) => setEditingProduto({ ...editingProduto, nome: e.target.value })}
                  placeholder="Ex: Livro Gestão Ágil e Mentoria"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                value={editingProduto?.descricao || ''}
                onChange={(e) =>
                  setEditingProduto({ ...editingProduto, descricao: e.target.value })
                }
                placeholder="Sinopse, edição, características do material"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Ano de Publicação</Label>
                <Input
                  type="number"
                  value={editingProduto?.ano_publicacao || ''}
                  onChange={(e) =>
                    setEditingProduto({ ...editingProduto, ano_publicacao: Number(e.target.value) })
                  }
                  placeholder="2025"
                />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Input
                  value={editingProduto?.categoria || ''}
                  onChange={(e) =>
                    setEditingProduto({ ...editingProduto, categoria: e.target.value })
                  }
                  placeholder="Livros / Apostilas"
                />
              </div>
              <div className="space-y-1">
                <Label>Unidade</Label>
                <Input
                  value={editingProduto?.unidade_medida || 'UN'}
                  onChange={(e) =>
                    setEditingProduto({ ...editingProduto, unidade_medida: e.target.value })
                  }
                  placeholder="UN, CX, KIT"
                />
              </div>
            </div>

            {/* Bloco de Preços e Margem */}
            <div className="p-3 bg-muted/40 rounded-xl border space-y-3">
              <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Precificação & Margem</span>
                <span className="text-primary font-bold">
                  Margem Calculada: {margemPercentual}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Preço de Compra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduto?.preco_compra || ''}
                    onChange={(e) =>
                      setEditingProduto({ ...editingProduto, preco_compra: Number(e.target.value) })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Preço de Venda (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduto?.preco_venda || ''}
                    onChange={(e) =>
                      setEditingProduto({ ...editingProduto, preco_venda: Number(e.target.value) })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Lucro Unitário (R$)</Label>
                  <Input
                    disabled
                    value={formatCurrency(lucroBruto)}
                    className="font-mono bg-background font-bold text-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Estoque */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Estoque Inicial / Atual</Label>
                <Input
                  type="number"
                  value={editingProduto?.estoque_atual ?? 0}
                  onChange={(e) =>
                    setEditingProduto({ ...editingProduto, estoque_atual: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label>Estoque Mínimo (Alerta)</Label>
                <Input
                  type="number"
                  value={editingProduto?.estoque_minimo ?? 5}
                  onChange={(e) =>
                    setEditingProduto({ ...editingProduto, estoque_minimo: Number(e.target.value) })
                  }
                  placeholder="5"
                />
              </div>
              <div className="space-y-1">
                <Label>Empresa (CNPJ)</Label>
                <select
                  value={editingProduto?.empresa_id || ''}
                  onChange={(e) =>
                    setEditingProduto({ ...editingProduto, empresa_id: e.target.value })
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome} ({emp.cnpj})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
