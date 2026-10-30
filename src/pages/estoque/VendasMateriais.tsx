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
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  FileText,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { estoqueService } from '@/services/estoque'
import { Produto, VendaMaterial, VendaMaterialItem, Client, Empresa } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useMainStore } from '@/stores/main'
import { formatCurrency } from '@/lib/utils'
import { ReciboEntregaPrint } from '@/pages/estoque/ReciboEntregaPrint'
import { EtiquetaEnvioPrint } from '@/pages/estoque/EtiquetaEnvioPrint'

export function VendasMateriaisPage() {
  const { toast } = useToast()
  const { selectedEmpresaId, empresas, clients } = useMainStore()
  const [vendas, setVendas] = useState<VendaMaterial[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estados para impressão
  const [vendaParaImprimir, setVendaParaImprimir] = useState<VendaMaterial | null>(null)
  const [tipoImpressao, setTipoImpressao] = useState<'recibo' | 'etiqueta' | null>(null)

  // Estado do formulário de nova venda
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteDoc, setClienteDoc] = useState('')
  const [clienteEndereco, setClienteEndereco] = useState('')
  const [descontoGeral, setDescontoGeral] = useState(0)
  const [nfNumero, setNfNumero] = useState('')
  const [dataVenda, setDataVenda] = useState(new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [criarFinanceiro, setCriarFinanceiro] = useState(true)
  const [empresaId, setEmpresaId] = useState('')

  // Linhas do carrinho de itens
  const [itens, setItens] = useState<
    {
      produto_id: string
      codigo: string
      descricao: string
      quantidade: number
      preco_unitario: number
      desconto: number
      total: number
      estoque_disponivel: number
    }[]
  >([])

  const loadData = async () => {
    try {
      setLoading(true)
      const [vendasList, prodList] = await Promise.all([
        estoqueService.listVendas(selectedEmpresaId),
        estoqueService.listProdutos(selectedEmpresaId),
      ])
      setVendas(vendasList)
      setProdutos(prodList)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as vendas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedEmpresaId])

  const handleOpenNovaVenda = () => {
    const defaultEmpresaId =
      selectedEmpresaId !== 'todas'
        ? selectedEmpresaId
        : empresas.find((e) => e.is_principal)?.id || empresas[0]?.id || ''

    setClienteId(clients[0]?.id || '')
    setClienteNome(clients[0]?.name || '')
    setClienteDoc('')
    setClienteEndereco('')
    setDescontoGeral(0)
    setNfNumero('')
    setDataVenda(new Date().toISOString().split('T')[0])
    setObservacoes('')
    setFormaPagamento('PIX')
    setCriarFinanceiro(true)
    setEmpresaId(defaultEmpresaId)

    // Adiciona uma primeira linha vazia com o primeiro produto disponível
    if (produtos.length > 0) {
      const p = produtos[0]
      setItens([
        {
          produto_id: p.id,
          codigo: p.codigo,
          descricao: p.nome,
          quantidade: 1,
          preco_unitario: Number(p.preco_venda) || 0,
          desconto: 0,
          total: Number(p.preco_venda) || 0,
          estoque_disponivel: p.estoque_atual || 0,
        },
      ])
    } else {
      setItens([])
    }

    setDialogOpen(true)
  }

  const handleSelectCliente = (id: string) => {
    setClienteId(id)
    const c = clients.find((cli) => cli.id === id)
    if (c) {
      setClienteNome(c.name || '')
      setClienteDoc(c.cnpj || '')
    }
  }

  const handleAddItem = () => {
    if (produtos.length === 0) return
    const p = produtos[0]
    setItens([
      ...itens,
      {
        produto_id: p.id,
        codigo: p.codigo,
        descricao: p.nome,
        quantidade: 1,
        preco_unitario: Number(p.preco_venda) || 0,
        desconto: 0,
        total: Number(p.preco_venda) || 0,
        estoque_disponivel: p.estoque_atual || 0,
      },
    ])
  }

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...itens]
    const item = { ...updated[index] }

    if (field === 'produto_id') {
      const prod = produtos.find((p) => p.id === val)
      if (prod) {
        item.produto_id = prod.id
        item.codigo = prod.codigo
        item.descricao = prod.nome
        item.preco_unitario = Number(prod.preco_venda) || 0
        item.estoque_disponivel = prod.estoque_atual || 0
      }
    } else if (field === 'quantidade') {
      item.quantidade = Math.max(1, Number(val) || 1)
    } else if (field === 'preco_unitario') {
      item.preco_unitario = Math.max(0, Number(val) || 0)
    } else if (field === 'desconto') {
      item.desconto = Math.max(0, Number(val) || 0)
    }

    item.total = Math.max(0, item.quantidade * item.preco_unitario - item.desconto)
    updated[index] = item
    setItens(updated)
  }

  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index))
    }
  }

  const subtotal = itens.reduce((acc, it) => acc + it.total, 0)
  const totalLiquido = Math.max(0, subtotal - (Number(descontoGeral) || 0))

  const handleFinalizarVenda = async () => {
    if (!clienteId || !clienteNome) {
      toast({
        title: 'Atenção',
        description: 'Selecione um cliente para associar à venda.',
        variant: 'destructive',
      })
      return
    }

    if (itens.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos um item à venda.',
        variant: 'destructive',
      })
      return
    }

    // Verificar se algum item excede o estoque
    for (const it of itens) {
      if (it.quantidade > it.estoque_disponivel) {
        if (
          !confirm(
            `Atenção: A quantidade do produto "${it.descricao}" (${it.quantidade}) é maior que o estoque atual (${it.estoque_disponivel}). Deseja prosseguir mesmo assim?`,
          )
        ) {
          return
        }
      }
    }

    try {
      setSaving(true)
      const venda = await estoqueService.registrarVenda({
        cliente_id: clienteId,
        cliente_nome: clienteNome,
        cliente_documento: clienteDoc,
        cliente_endereco: clienteEndereco,
        itens: itens.map((i) => ({
          produto_id: i.produto_id,
          codigo: i.codigo,
          descricao: i.descricao,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          desconto: i.desconto,
          total: i.total,
        })),
        desconto: Number(descontoGeral) || 0,
        nf_numero: nfNumero,
        data_venda: dataVenda,
        observacoes,
        forma_pagamento: formaPagamento,
        empresa_id: empresaId,
        criarTransacaoFinanceira: criarFinanceiro,
      })

      toast({
        title: 'Venda Concluída!',
        description: `Pedido ${venda.numero_pedido} registrado e estoque atualizado com sucesso.`,
      })

      setDialogOpen(false)
      await loadData()

      // Abre automaticamente o recibo para impressão
      setVendaParaImprimir(venda)
      setTipoImpressao('recibo')
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar venda',
        description: err.message || 'Falha ao processar venda de materiais.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVenda = async (id: string) => {
    if (confirm('Deseja realmente excluir este registro de venda?')) {
      try {
        await estoqueService.deleteVenda(id)
        toast({ title: 'Excluído', description: 'Registro de venda removido.' })
        loadData()
      } catch (err) {
        toast({ title: 'Erro', description: 'Falha ao excluir venda.', variant: 'destructive' })
      }
    }
  }

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-primary" /> Vendas de Materiais & Livros
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro de pedidos com múltiplos itens, descontos, baixa automática de estoque e
            geração de recibo/etiqueta.
          </p>
        </div>
        <Button onClick={handleOpenNovaVenda} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Nova Venda (PDV)
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Histórico de Pedidos de Venda</CardTitle>
            <div className="text-xs text-muted-foreground">
              Total: <strong>{vendas.length}</strong> pedido(s)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Pedido / Data</th>
                  <th className="py-3 px-4">Cliente / Destinatário</th>
                  <th className="py-3 px-4">Itens Vendidos</th>
                  <th className="py-3 px-4 text-center">NF Ref.</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Pagamento</th>
                  <th className="py-3 px-4 text-right">Documentos / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Carregando pedidos de materiais...
                    </td>
                  </tr>
                ) : vendas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhuma venda registrada para o CNPJ selecionado.
                    </td>
                  </tr>
                ) : (
                  vendas.map((v) => {
                    const itensArray: VendaMaterialItem[] = Array.isArray(v.itens_json)
                      ? v.itens_json
                      : []
                    const totalQtd = itensArray.reduce((acc, it) => acc + (it.quantidade || 0), 0)

                    return (
                      <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-primary text-xs">
                            {v.numero_pedido}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {v.data_venda
                              ? new Date(v.data_venda).toLocaleDateString('pt-BR')
                              : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">
                            {v.cliente_nome || v.expand?.cliente_id?.name || 'Cliente'}
                          </div>
                          {v.cliente_documento && (
                            <div className="text-xs text-muted-foreground font-mono">
                              Doc: {v.cliente_documento}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-foreground font-medium">
                            {totalQtd} item(s) no pedido:
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {itensArray.map((it) => `${it.quantidade}x ${it.descricao}`).join(', ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {v.nf_numero ? (
                            <Badge variant="outline" className="font-mono text-[11px]">
                              NF {v.nf_numero}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(v.valor_total)}
                          {v.desconto > 0 && (
                            <div className="text-[10px] text-emerald-600 font-normal">
                              Desc: -{formatCurrency(v.desconto)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {v.forma_pagamento || 'PIX'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs text-foreground hover:text-primary"
                              title="Imprimir Recibo de Entrega A4"
                              onClick={() => {
                                setVendaParaImprimir(v)
                                setTipoImpressao('recibo')
                              }}
                            >
                              <FileText className="w-3.5 h-3.5" /> Recibo
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs text-foreground hover:text-primary"
                              title="Imprimir Etiqueta de Envio"
                              onClick={() => {
                                setVendaParaImprimir(v)
                                setTipoImpressao('etiqueta')
                              }}
                            >
                              <Tag className="w-3.5 h-3.5" /> Etiqueta
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteVenda(v.id)}
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

      {/* Dialog de Nova Venda com Carrinho Múltiplos Itens */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Registrar Venda de Materiais
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Dados do Cliente */}
            <div className="p-3 bg-muted/40 rounded-xl border space-y-3">
              <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                1. Cliente / Mentorando
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Selecionar da Base Existente *</Label>
                  <select
                    value={clienteId}
                    onChange={(e) => handleSelectCliente(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Nome na Nota / Recibo *</Label>
                  <Input
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Nome completo ou Razão Social"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>CPF / CNPJ do Cliente</Label>
                  <Input
                    value={clienteDoc}
                    onChange={(e) => setClienteDoc(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Endereço de Entrega (para Etiqueta)</Label>
                  <Input
                    value={clienteEndereco}
                    onChange={(e) => setClienteEndereco(e.target.value)}
                    placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                  />
                </div>
              </div>
            </div>

            {/* Linhas de Itens (Carrinho) */}
            <div className="p-3 bg-muted/40 rounded-xl border space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  2. Itens do Pedido ({itens.length})
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="gap-1 text-xs h-7"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Linha
                </Button>
              </div>

              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border bg-card grid grid-cols-12 gap-2 items-end shadow-sm"
                  >
                    <div className="col-span-12 md:col-span-5 space-y-1">
                      <Label className="text-xs">Produto / Livro</Label>
                      <select
                        value={item.produto_id}
                        onChange={(e) => handleItemChange(idx, 'produto_id', e.target.value)}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                      >
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codigo} - {p.nome} (Estq: {p.estoque_atual})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label className="text-xs">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-8 text-xs"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2 space-y-1">
                      <Label className="text-xs">Preço Unit. (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-xs"
                        value={item.preco_unitario}
                        onChange={(e) => handleItemChange(idx, 'preco_unitario', e.target.value)}
                      />
                    </div>

                    <div className="col-span-3 md:col-span-2 space-y-1">
                      <Label className="text-xs">Total (R$)</Label>
                      <Input
                        disabled
                        className="h-8 text-xs font-mono font-bold bg-muted"
                        value={formatCurrency(item.total)}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-1 flex justify-end pb-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={itens.length === 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totalizadores e Parâmetros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nº Nota Fiscal (Ref.)</Label>
                    <Input
                      value={nfNumero}
                      onChange={(e) => setNfNumero(e.target.value)}
                      placeholder="Ex: 004.589"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data da Venda</Label>
                    <Input
                      type="date"
                      value={dataVenda}
                      onChange={(e) => setDataVenda(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Forma de Pagamento</Label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Boleto">Boleto Bancário</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Transferência">Transferência Bancária</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Empresa (CNPJ)</Label>
                    <select
                      value={empresaId}
                      onChange={(e) => setEmpresaId(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                    >
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nome} ({emp.cnpj})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Observações do Pedido</Label>
                  <Input
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Instruções de entrega, dedicatória no livro, etc."
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="criar_transacao"
                    checked={criarFinanceiro}
                    onChange={(e) => setCriarFinanceiro(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <Label htmlFor="criar_transacao" className="text-xs cursor-pointer font-medium">
                    Gerar lançamento de Receita no Módulo Financeiro
                  </Label>
                </div>
              </div>

              {/* Box de Totais */}
              <div className="p-4 bg-muted/50 rounded-xl border flex flex-col justify-between space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal dos Itens:</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Desconto Geral (R$):</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-28 h-7 text-right font-mono text-xs"
                      value={descontoGeral}
                      onChange={(e) => setDescontoGeral(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg text-foreground">
                    <span>Valor Total Líquido:</span>
                    <span className="font-mono text-primary">{formatCurrency(totalLiquido)}</span>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground bg-muted p-2 rounded">
                  * A confirmação da venda dará baixa automática na quantidade de cada
                  livro/material no estoque e gerará a opção de imprimir o Recibo e a Etiqueta de
                  Envio.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleFinalizarVenda} disabled={saving} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Processando Venda...' : 'Finalizar Venda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão do Recibo de Entrega A4 */}
      {vendaParaImprimir && tipoImpressao === 'recibo' && (
        <ReciboEntregaPrint
          venda={vendaParaImprimir}
          empresa={empresas.find((e) => e.id === vendaParaImprimir.empresa_id) || empresas[0]}
          onClose={() => {
            setVendaParaImprimir(null)
            setTipoImpressao(null)
          }}
        />
      )}

      {/* Modal de Impressão da Etiqueta de Envio */}
      {vendaParaImprimir && tipoImpressao === 'etiqueta' && (
        <EtiquetaEnvioPrint
          venda={vendaParaImprimir}
          empresa={empresas.find((e) => e.id === vendaParaImprimir.empresa_id) || empresas[0]}
          onClose={() => {
            setVendaParaImprimir(null)
            setTipoImpressao(null)
          }}
        />
      )}
    </div>
  )
}
