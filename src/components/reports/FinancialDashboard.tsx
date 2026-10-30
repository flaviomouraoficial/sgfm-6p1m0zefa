import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Landmark, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useMainStore } from '@/stores/main'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { Transaction, ContaFinanceira } from '@/lib/types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FinancialDashboard({
  allTransactions,
  contas,
}: {
  allTransactions: Transaction[]
  contas: ContaFinanceira[]
}) {
  const { systemSettings } = useMainStore()
  const fiscalConfig = systemSettings?.fiscalConfig
  const fiscalMode = fiscalConfig?.operationMode || 'teste_2026'
  const isFiscalActive = fiscalMode !== 'regime_atual'

  const [contaId, setContaId] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (t.status?.toLowerCase() !== 'pago') return false
      if (contaId !== 'all' && t.conta_id !== contaId) return false
      if (startDate && t.date < startDate) return false
      if (endDate && t.date > endDate) return false
      return true
    })
  }, [allTransactions, contaId, startDate, endDate])

  const chartData = useMemo(() => {
    const map: Record<string, { month: string; Receitas: number; Despesas: number }> = {}

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map[m] = { month: m, Receitas: 0, Despesas: 0 }
    }

    filtered.forEach((t) => {
      const m = t.date.substring(0, 7)
      if (!map[m]) map[m] = { month: m, Receitas: 0, Despesas: 0 }

      if (t.type === 'Receita' || t.type === 'Crédito') {
        map[m].Receitas += t.amount || 0
      } else {
        map[m].Despesas += t.amount || 0
      }
    })

    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [filtered])

  const totalRev = filtered.reduce(
    (acc, t) => (t.type === 'Receita' || t.type === 'Crédito' ? acc + (t.amount || 0) : acc),
    0,
  )
  const totalExp = filtered.reduce(
    (acc, t) => (t.type === 'Despesa' || t.type === 'Débito' ? acc + (t.amount || 0) : acc),
    0,
  )

  // Métricas de Impacto Reforma Tributária & Split Payment
  const fiscalMetrics = useMemo(() => {
    const receitas = filtered.filter((t) => t.type === 'Receita' || t.type === 'Crédito')
    let totalBrutoReceitas = 0
    let totalCBS = 0
    let totalIBS = 0
    let totalSplitRetido = 0
    let countFiscais = 0

    receitas.forEach((t) => {
      const bruto = t.amount_bruto || t.amount || 0
      totalBrutoReceitas += bruto

      if (t.emits_fiscal_doc) {
        countFiscais++
        const cbs =
          t.cbs_amount !== undefined
            ? t.cbs_amount
            : (bruto * (fiscalConfig?.cbsAliquota ?? 0.9)) / 100
        const ibs =
          t.ibs_amount !== undefined
            ? t.ibs_amount
            : (bruto * (fiscalConfig?.ibsAliquota ?? 0.1)) / 100
        totalCBS += cbs
        totalIBS += ibs
        const split =
          t.split_payment_amount !== undefined
            ? t.split_payment_amount
            : fiscalMode === 'teste_2026'
              ? 0
              : cbs + ibs
        totalSplitRetido += split
      }
    })

    return {
      totalBrutoReceitas,
      totalCBS,
      totalIBS,
      totalTributos: totalCBS + totalIBS,
      totalSplitRetido,
      countFiscais,
    }
  }, [filtered, fiscalConfig, fiscalMode])

  return (
    <div className="space-y-6">
      <div className="space-y-4 animate-fade-in-up">
        <h2 className="text-xl font-semibold tracking-tight text-accent">
          Saldos das Contas (Tempo Real)
        </h2>
        {contas.length === 0 ? (
          <Card className="shadow-sm border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <p className="text-muted-foreground font-medium mb-1">
                Nenhuma conta bancária registrada.
              </p>
              <p className="text-sm text-muted-foreground">
                Crie sua primeira conta financeira na aba "Transações" para acompanhar seus saldos
                em tempo real.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {contas.map((conta) => {
              const accountTxs = allTransactions.filter(
                (t) => t.conta_id === conta.id && t.status?.toLowerCase() === 'pago',
              )
              const currentBalance = accountTxs.reduce((acc, t) => {
                if (t.type === 'Receita' || t.type === 'Crédito') return acc + (t.amount || 0)
                if (t.type === 'Despesa' || t.type === 'Débito') return acc - (t.amount || 0)
                return acc
              }, conta.saldo_inicial || 0)

              return (
                <div
                  key={conta.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-lg shadow-sm border-l-4 border-l-primary gap-2"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-base">{conta.nome}</span>
                    <span className="text-xs text-muted-foreground font-medium">{conta.tipo}</span>
                  </div>
                  <div className="sm:text-right flex flex-col sm:items-end">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5 font-semibold">
                      Saldo Atualizado
                    </span>
                    <span
                      className={`text-xl font-bold tracking-tight ${currentBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}
                    >
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Filtros do Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-1.5 w-full sm:w-64">
            <label className="text-xs font-medium">Conta Financeira</label>
            <Select value={contaId} onValueChange={setContaId}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Contas</SelectItem>
                {contas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full sm:w-48">
            <label className="text-xs font-medium">Data Inicial</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 w-full sm:w-48">
            <label className="text-xs font-medium">Data Final</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalRev)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExp)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalRev - totalExp >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(totalRev - totalExp)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card Impacto Split Payment / Reforma Tributária (quando ativo) */}
      {isFiscalActive && (
        <Card className="border-l-4 border-l-indigo-600 shadow-sm bg-gradient-to-r from-indigo-50/50 via-background to-background dark:from-indigo-950/20">
          <CardHeader className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-base font-semibold">
                    Impacto Projetado — Split Payment & Reforma Tributária
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Baseado nas transações reais do período ({fiscalMetrics.countFiscais}{' '}
                    lançamentos fiscais).
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase bg-background font-medium">
                  {fiscalMode === 'teste_2026' ? 'Ano-teste 2026' : 'Transição 2027+'}
                </Badge>
                <Link
                  to="/admin/reforma-tributaria"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Abrir Simulador <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center sm:text-left pt-2 border-t border-border/50">
              <div className="p-3 bg-background rounded-lg border border-border/60">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase block mb-1">
                  CBS Destacada ({fiscalConfig?.cbsAliquota ?? 0.9}%)
                </span>
                <span className="text-lg font-bold text-amber-600">
                  {formatCurrency(fiscalMetrics.totalCBS)}
                </span>
              </div>

              <div className="p-3 bg-background rounded-lg border border-border/60">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase block mb-1">
                  IBS Destacado ({fiscalConfig?.ibsAliquota ?? 0.1}%)
                </span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(fiscalMetrics.totalIBS)}
                </span>
              </div>

              <div className="p-3 bg-background rounded-lg border border-border/60">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase block mb-1">
                  Total CBS + IBS
                </span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(fiscalMetrics.totalTributos)}
                </span>
              </div>

              <div className="p-3 bg-background rounded-lg border border-border/60">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase block mb-1">
                  {fiscalMode === 'teste_2026'
                    ? 'Retenção Efetiva (2026)'
                    : 'Retido na Baixa (Split)'}
                </span>
                <span className="text-lg font-bold text-destructive">
                  {fiscalMode === 'teste_2026'
                    ? 'R$ 0,00 (Ano-teste)'
                    : formatCurrency(fiscalMetrics.totalSplitRetido)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              {fiscalMode === 'teste_2026' ? (
                <span>
                  <strong>Ano-teste:</strong> Os valores de CBS (0,9%) e IBS (0,1%) são puramente
                  informativos e não sofrem retenção financeira no momento da baixa bancária (art.
                  375 da LC 214/2025).
                </span>
              ) : (
                <span>
                  <strong>Atenção ao fluxo:</strong> No modelo de Split Payment ativo para 2027+, os
                  impostos são recolhidos automaticamente pelo arranjo de pagamento no momento da
                  liquidação bancária.
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Evolução de Receitas (Créditos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ Receitas: { color: 'hsl(var(--primary))', label: 'Receitas' } }}
              className="h-[350px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(v) => v.split('-').reverse().join('/')}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$ ${v / 1000}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="Receitas"
                    stroke="var(--color-Receitas)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Receitas vs. Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Receitas: { color: 'hsl(var(--primary))', label: 'Receitas' },
                Despesas: { color: '#ef4444', label: 'Despesas' },
              }}
              className="h-[350px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(v) => v.split('-').reverse().join('/')}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$ ${v / 1000}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="Receitas" fill="var(--color-Receitas)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="var(--color-Despesas)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
