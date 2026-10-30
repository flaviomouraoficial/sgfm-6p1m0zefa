import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  AlertTriangle,
  Calendar,
  Download,
  Package,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import { estoqueService } from '@/services/estoque'
import { Produto, VendaMaterial, EstoqueMovimentacao } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useMainStore } from '@/stores/main'
import { formatCurrency, exportToCSV } from '@/lib/utils'

export function RelatoriosEstoquePage() {
  const { toast } = useToast()
  const { selectedEmpresaId, empresas } = useMainStore()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [vendas, setVendas] = useState<VendaMaterial[]>([])
  const [movimentacoes, setMovimentacoes] = useState<EstoqueMovimentacao[]>([])
  const [loading, setLoading] = useState(false)

  // Filtros de período
  const [dataInicio, setDataInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  )
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0])
  const [tabAtiva, setTabAtiva] = useState<'posicao' | 'vendas' | 'alertas'>('posicao')

  const loadData = async () => {
    try {
      setLoading(true)
      const [prodList, vendasList, movList] = await Promise.all([
        estoqueService.listProdutos(selectedEmpresaId),
        estoqueService.listVendas(selectedEmpresaId),
        estoqueService.listMovimentacoes(selectedEmpresaId),
      ])
      setProdutos(prodList)
      setVendas(vendasList)
      setMovimentacoes(movList)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar relatórios.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedEmpresaId])

  // Cálculos consolidados
  const totalItensEstoque = produtos.reduce((acc, p) => acc + (p.estoque_atual || 0), 0)
  const valorTotalCusto = produtos.reduce(
    (acc, p) => acc + (p.estoque_atual || 0) * (Number(p.preco_compra) || 0),
    0,
  )
  const valorTotalVenda = produtos.reduce(
    (acc, p) => acc + (p.estoque_atual || 0) * (Number(p.preco_venda) || 0),
    0,
  )

  const produtosEstoqueBaixo = produtos.filter(
    (p) => (p.estoque_atual || 0) <= (p.estoque_minimo || 0),
  )

  // Vendas no período selecionado
  const vendasNoPeriodo = vendas.filter((v) => {
    if (!v.data_venda) return true
    return v.data_venda >= dataInicio && v.data_venda <= dataFim
  })

  const totalFaturadoVendas = vendasNoPeriodo.reduce(
    (acc, v) => acc + (Number(v.valor_total) || 0),
    0,
  )
  const totalDescontosVendas = vendasNoPeriodo.reduce(
    (acc, v) => acc + (Number(v.desconto) || 0),
    0,
  )

  // Exportar dados para CSV
  const handleExportCSV = () => {
    if (tabAtiva === 'posicao') {
      const data = produtos.map((p) => ({
        Codigo: p.codigo,
        Produto: p.nome,
        Categoria: p.categoria || '',
        Ano: p.ano_publicacao || '',
        EstoqueAtual: p.estoque_atual,
        EstoqueMinimo: p.estoque_minimo,
        PrecoCompra: p.preco_compra,
        PrecoVenda: p.preco_venda,
        ValorTotalCusto: (p.estoque_atual || 0) * (Number(p.preco_compra) || 0),
        ValorTotalVenda: (p.estoque_atual || 0) * (Number(p.preco_venda) || 0),
      }))
      exportToCSV(data, 'relatorio_posicao_estoque')
    } else if (tabAtiva === 'vendas') {
      const data = vendasNoPeriodo.map((v) => ({
        NumeroPedido: v.numero_pedido,
        Data: v.data_venda,
        Cliente: v.cliente_nome || '',
        Documento: v.cliente_documento || '',
        Subtotal: v.subtotal,
        Desconto: v.desconto,
        Total: v.valor_total,
        NF: v.nf_numero || '',
        FormaPagamento: v.forma_pagamento || '',
      }))
      exportToCSV(data, 'relatorio_vendas_materiais')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" /> Relatórios de Estoque & Vendas
          </h1>
          <p className="text-muted-foreground mt-1">
            Posição física e financeira de estoque, produtos em nível crítico e faturamento de
            materiais por período.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardDescription className="text-xs uppercase font-medium">
              Estoque Físico Total
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{totalItensEstoque} un</CardTitle>
            <span className="text-xs text-muted-foreground">
              {produtos.length} títulos cadastrados
            </span>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardDescription className="text-xs uppercase font-medium">
              Valor em Custo
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-muted-foreground">
              {formatCurrency(valorTotalCusto)}
            </CardTitle>
            <span className="text-xs text-muted-foreground">Capital imobilizado</span>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardDescription className="text-xs uppercase font-medium">
              Potencial de Venda
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-emerald-600">
              {formatCurrency(valorTotalVenda)}
            </CardTitle>
            <span className="text-xs text-emerald-600">
              Lucro projetado: {formatCurrency(valorTotalVenda - valorTotalCusto)}
            </span>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="py-3">
            <CardDescription className="text-xs uppercase font-medium">
              Produtos no Limite / Baixo
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">
              {produtosEstoqueBaixo.length}
            </CardTitle>
            <span className="text-xs text-amber-600">Exigem reposição</span>
          </CardHeader>
        </Card>
      </div>

      {/* Abas e Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3">
        <div className="flex gap-2">
          <Button
            variant={tabAtiva === 'posicao' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTabAtiva('posicao')}
          >
            Posição Atual de Estoque
          </Button>
          <Button
            variant={tabAtiva === 'vendas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTabAtiva('vendas')}
          >
            Vendas por Período
          </Button>
          <Button
            variant={tabAtiva === 'alertas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTabAtiva('alertas')}
            className="relative"
          >
            Estoque Crítico
            {produtosEstoqueBaixo.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 h-4">
                {produtosEstoqueBaixo.length}
              </Badge>
            )}
          </Button>
        </div>

        {tabAtiva === 'vendas' && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Período:</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-8 text-xs w-36"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
        )}
      </div>

      {/* Tabela de Posição de Estoque */}
      {tabAtiva === 'posicao' && (
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Posição Físico-Financeira de Estoque</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Estoque Mín.</th>
                    <th className="py-3 px-4 text-right">Custo Unit.</th>
                    <th className="py-3 px-4 text-right">Venda Unit.</th>
                    <th className="py-3 px-4 text-right">Custo Total</th>
                    <th className="py-3 px-4 text-right">Venda Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {produtos.map((p) => {
                    const cTotal = (p.estoque_atual || 0) * (Number(p.preco_compra) || 0)
                    const vTotal = (p.estoque_atual || 0) * (Number(p.preco_venda) || 0)
                    const critico = (p.estoque_atual || 0) <= (p.estoque_minimo || 0)

                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-primary">
                          {p.codigo}
                        </td>
                        <td className="py-3 px-4 font-medium">{p.nome}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono">
                          {p.estoque_atual || 0}
                          {critico && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground font-mono">
                          {p.estoque_minimo || 0}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {formatCurrency(Number(p.preco_compra) || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          {formatCurrency(Number(p.preco_venda) || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {formatCurrency(cTotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(vTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Vendas por Período */}
      {tabAtiva === 'vendas' && (
        <Card className="shadow-sm">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Vendas Realizadas no Período</CardTitle>
            <div className="text-sm font-semibold">
              Faturamento Líquido:{' '}
              <span className="font-mono text-primary">{formatCurrency(totalFaturadoVendas)}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Pedido</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">NF Ref.</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Desconto</th>
                    <th className="py-3 px-4 text-right">Total Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {vendasNoPeriodo.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Nenhuma venda encontrada no intervalo selecionado.
                      </td>
                    </tr>
                  ) : (
                    vendasNoPeriodo.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                          {v.data_venda ? new Date(v.data_venda).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-primary">
                          {v.numero_pedido}
                        </td>
                        <td className="py-3 px-4 font-medium">{v.cliente_nome || 'Cliente'}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {v.nf_numero ? `NF ${v.nf_numero}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {formatCurrency(v.subtotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600">
                          {v.desconto > 0 ? `-${formatCurrency(v.desconto)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(v.valor_total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Estoque Crítico / Baixo */}
      {tabAtiva === 'alertas' && (
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="py-3">
            <CardTitle className="text-base text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Produtos que Exigem Reposição
              Urgente
            </CardTitle>
            <CardDescription>
              Produtos cujo saldo atual está igual ou abaixo do estoque mínimo definido.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                    <th className="py-3 px-4 text-center">Falta / Déficit</th>
                    <th className="py-3 px-4 text-right">Custo Reposição Mínima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {produtosEstoqueBaixo.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-emerald-600 font-medium">
                        Excelente! Todos os produtos estão com níveis saudáveis de estoque.
                      </td>
                    </tr>
                  ) : (
                    produtosEstoqueBaixo.map((p) => {
                      const deficit = Math.max(0, (p.estoque_minimo || 0) - (p.estoque_atual || 0))
                      const custoReposicao = deficit * (Number(p.preco_compra) || 0)

                      return (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-mono font-bold text-xs text-primary">
                            {p.codigo}
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">{p.nome}</td>
                          <td className="py-3 px-4 text-center font-bold text-amber-600 font-mono">
                            {p.estoque_atual || 0}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                            {p.estoque_minimo || 0}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-red-600 font-mono">
                            {deficit > 0 ? `-${deficit} un` : 'No Limite'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            {formatCurrency(custoReposicao)}
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
      )}
    </div>
  )
}
