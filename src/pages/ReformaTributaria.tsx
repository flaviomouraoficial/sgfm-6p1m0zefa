import { useState, useMemo } from 'react'
import {
  Landmark,
  Calculator,
  ArrowRight,
  TrendingDown,
  Clock,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useMainStore } from '@/stores/main'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'

export function ReformaTributaria() {
  const { systemSettings } = useMainStore()
  const cfg = systemSettings?.fiscalConfig

  // Inputs da simulação
  const [faturamentoMensal, setFaturamentoMensal] = useState<number>(100000)
  const [prazoMedioDias, setPrazoMedioDias] = useState<number>(30)
  const [percentualTributavel, setPercentualTributavel] = useState<number>(100)
  const [cbsAliquota, setCbsAliquota] = useState<number>(cfg?.cbsAliquota ?? 0.9)
  const [ibsAliquota, setIbsAliquota] = useState<number>(cfg?.ibsAliquota ?? 0.1)
  const [creditoPresumido, setCreditoPresumido] = useState<number>(
    cfg?.creditoPresumidoPercent ?? 0,
  )
  const [simularTransicao2027, setSimularTransicao2027] = useState<boolean>(false)

  // Alíquotas ativas
  const effectiveCbs = simularTransicao2027 ? 8.8 : cbsAliquota
  const effectiveIbs = simularTransicao2027 ? 17.7 : ibsAliquota
  const aliquotaTotal = effectiveCbs + effectiveIbs

  // Cálculos do Split Payment
  const metrics = useMemo(() => {
    const baseTributavel = (faturamentoMensal * percentualTributavel) / 100
    const valorCBS = (baseTributavel * effectiveCbs) / 100
    const valorIBS = (baseTributavel * effectiveIbs) / 100
    const impostoBruto = valorCBS + valorIBS
    const valorCredito = (impostoBruto * creditoPresumido) / 100
    const impostoEfetivoMensal = Math.max(0, impostoBruto - valorCredito)

    // No regime atual / sem split payment:
    // A empresa recebe 100% do faturamento na baixa e só recolhe o imposto no vencimento da guia (ex: dia 20 do mês seguinte).
    // Com o Split Payment:
    // O valor do imposto é retido no ato da liquidação de cada boleto/PIX/cartão pelo banco, antes do crédito na conta da empresa.
    const caixaLiquidoRecebidoMensal = faturamentoMensal - impostoEfetivoMensal
    const impactoAnual = impostoEfetivoMensal * 12

    // Capital de giro preso (dias de faturamento com imposto retido antecipadamente):
    // Como o imposto é descontado instantaneamente em vez de 20 a 50 dias depois, o capital de giro operacional sofre erosão imediata.
    const capitalGiroPreso = (impostoEfetivoMensal / 30) * Math.max(1, prazoMedioDias)

    return {
      baseTributavel,
      valorCBS,
      valorIBS,
      impostoEfetivoMensal,
      caixaLiquidoRecebidoMensal,
      impactoAnual,
      capitalGiroPreso,
      aliquotaEfetiva: (impostoEfetivoMensal / (faturamentoMensal || 1)) * 100,
    }
  }, [
    faturamentoMensal,
    percentualTributavel,
    effectiveCbs,
    effectiveIbs,
    creditoPresumido,
    prazoMedioDias,
  ])

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Dados do gráfico comparativo mensal
  const chartData = useMemo(() => {
    return [
      {
        mes: 'Mês 1',
        caixaTradicional: faturamentoMensal,
        caixaComSplit: metrics.caixaLiquidoRecebidoMensal,
        impostoRetido: metrics.impostoEfetivoMensal,
      },
      {
        mes: 'Mês 2',
        caixaTradicional: faturamentoMensal,
        caixaComSplit: metrics.caixaLiquidoRecebidoMensal,
        impostoRetido: metrics.impostoEfetivoMensal,
      },
      {
        mes: 'Mês 3',
        caixaTradicional: faturamentoMensal,
        caixaComSplit: metrics.caixaLiquidoRecebidoMensal,
        impostoRetido: metrics.impostoEfetivoMensal,
      },
      {
        mes: 'Mês 4',
        caixaTradicional: faturamentoMensal,
        caixaComSplit: metrics.caixaLiquidoRecebidoMensal,
        impostoRetido: metrics.impostoEfetivoMensal,
      },
      {
        mes: 'Mês 5',
        caixaTradicional: faturamentoMensal,
        caixaComSplit: metrics.caixaLiquidoRecebidoMensal,
        impostoRetido: metrics.impostoEfetivoMensal,
      },
      {
        mes: 'Mês 6',
        caixaTradicional: faturamentoMensal,
        caixaComSplit: metrics.caixaLiquidoRecebidoMensal,
        impostoRetido: metrics.impostoEfetivoMensal,
      },
    ]
  }, [faturamentoMensal, metrics])

  // Cronograma da Reforma
  const timeline = [
    {
      ano: '2026',
      titulo: 'Ano-teste (CBS 0,9% + IBS 0,1%)',
      status: 'Atual',
      desc: 'Alíquotas de teste são destacadas nos documentos fiscais e recibos sem cobrança efetiva (compensáveis via PIS/Cofins, art. 375 LC 214/2025). Ideal para homologação de sistemas.',
    },
    {
      ano: '2027',
      titulo: 'Início da CBS Efetiva (8,8%)',
      status: 'Próximo',
      desc: 'Extinção definitiva de PIS e Cofins. Cobrança plena da CBS pelo Governo Federal. Início da transição de alíquotas.',
    },
    {
      ano: 'Agosto/2027',
      titulo: 'Entrada Obrigatória do Split Payment',
      status: 'Crítico',
      desc: 'Liquidação bancária via arranjo de pagamento (PIX, cartões, boletos) passa a reter o imposto no ato do pagamento e transferir direto aos cofres públicos.',
    },
    {
      ano: '2029 - 2032',
      titulo: 'Transição Gradual ICMS/ISS para IBS',
      status: 'Futuro',
      desc: 'Redução gradativa de 10% a cada ano dos impostos atuais e aumento correspondente da alíquota de IBS (estimada em ~17,7%).',
    },
    {
      ano: '2033',
      titulo: 'Vigência Plena do Novo Sistema',
      status: 'Final',
      desc: 'Extinção total do ICMS, ISS e IPI. Vigência integral e unificada de CBS e IBS em todo o território nacional.',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Simulador de Split Payment & Reforma Tributária
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Planejamento de fluxo de caixa e impacto de capital de giro sob a LC 214/2025 (IBS e
            CBS).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={simularTransicao2027 ? 'default' : 'secondary'}
            className="text-xs px-3 py-1 font-medium"
          >
            {simularTransicao2027
              ? 'Simulando Transição 2027+ (26,5%)'
              : 'Modo Ano-teste 2026 (1,0%)'}
          </Badge>
        </div>
      </div>

      {/* Grid: Inputs vs KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parâmetros de Entrada */}
        <Card className="lg:col-span-5 shadow-sm border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Parâmetros da Empresa</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="toggle-2027" className="text-xs font-semibold cursor-pointer">
                  Cenário 2027+
                </Label>
                <Switch
                  id="toggle-2027"
                  checked={simularTransicao2027}
                  onCheckedChange={setSimularTransicao2027}
                />
              </div>
            </div>
            <CardDescription className="text-xs">
              Ajuste as variáveis operacionais para recalcular a retenção em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Faturamento Bruto Mensal</Label>
                <span className="font-bold text-primary">{fmt(faturamentoMensal)}</span>
              </div>
              <Input
                type="number"
                step="1000"
                min="0"
                value={faturamentoMensal}
                onChange={(e) => setFaturamentoMensal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Prazo Médio de Recebimento (dias)</Label>
                <span className="font-bold text-foreground">{prazoMedioDias} dias</span>
              </div>
              <Slider
                value={[prazoMedioDias]}
                min={0}
                max={90}
                step={5}
                onValueChange={(val) => setPrazoMedioDias(val[0])}
              />
              <p className="text-[11px] text-muted-foreground">
                Tempo médio entre a emissão e a liquidação financeira pelo cliente.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">% da Receita Sujeita ao IBS/CBS</Label>
                <span className="font-bold text-foreground">{percentualTributavel}%</span>
              </div>
              <Slider
                value={[percentualTributavel]}
                min={10}
                max={100}
                step={5}
                onValueChange={(val) => setPercentualTributavel(val[0])}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1">
                <Label className="text-xs">Alíquota CBS (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled={simularTransicao2027}
                  value={effectiveCbs}
                  onChange={(e) => setCbsAliquota(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs bg-background"
                />
                <span className="text-[10px] text-muted-foreground">
                  {simularTransicao2027 ? 'Fixado 8,8% (padrão 2027)' : 'Ano-teste: 0,9%'}
                </span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alíquota IBS (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled={simularTransicao2027}
                  value={effectiveIbs}
                  onChange={(e) => setIbsAliquota(parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs bg-background"
                />
                <span className="text-[10px] text-muted-foreground">
                  {simularTransicao2027 ? 'Fixado 17,7% (padrão est.)' : 'Ano-teste: 0,1%'}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-border/50">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Crédito Presumido / Compras (%)</Label>
                <span className="text-xs font-bold text-muted-foreground">{creditoPresumido}%</span>
              </div>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={creditoPresumido}
                onChange={(e) => setCreditoPresumido(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
                placeholder="Ex: 0"
              />
              <span className="text-[10px] text-muted-foreground">
                Compensação de créditos sobre insumos/compras.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Resultados & KPIs Visuais */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Desaparece na baixa */}
            <Card className="border-l-4 border-l-destructive shadow-sm bg-destructive/5">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    Desaparece na Baixa
                  </span>
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <div className="text-xl font-bold text-destructive">
                  {fmt(metrics.impostoEfetivoMensal)}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Retido diretamente pelo banco/meio de pagamento a cada mês.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Caixa Líquido Efetivo */}
            <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-emerald-50/40 dark:bg-emerald-950/20">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    Caixa Líquido Real
                  </span>
                  <Coins className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold text-emerald-600">
                  {fmt(metrics.caixaLiquidoRecebidoMensal)}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Valor que efetivamente entra na conta bancária da empresa.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Capital de Giro Preso */}
            <Card className="border-l-4 border-l-amber-500 shadow-sm bg-amber-50/40 dark:bg-amber-950/20">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">
                    Capital de Giro Preso
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold text-amber-600">
                  {fmt(metrics.capitalGiroPreso)}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Impacto de antecipação do fluxo de caixa operacional.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Comparativo: Caixa Atual vs Caixa com Split Payment */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Comparativo: Caixa Tradicional vs Caixa com Split Payment
              </CardTitle>
              <CardDescription className="text-xs">
                Demonstra como a liquidação bancária imediata reduz a liquidez disponível no dia a
                dia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mes" textAnchor="middle" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(val: number) => [fmt(val), '']}
                      contentStyle={{ backgroundColor: 'white', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar
                      dataKey="caixaTradicional"
                      name="Caixa Tradicional (100% recebido)"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="caixaComSplit"
                      name="Caixa com Split (Líquido pós-retenção)"
                      fill="#288f87"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="impostoRetido"
                      name="Imposto Retido na Baixa"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Anual */}
          <div className="bg-muted/40 p-3.5 rounded-lg border border-border/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">Projeção Anual de Retenção: </span>
              <span className="font-bold text-destructive text-sm">
                {fmt(metrics.impactoAnual)}
              </span>
              <span className="text-muted-foreground ml-2">
                (Alíquota combinada efetiva: {metrics.aliquotaEfetiva.toFixed(2)}%)
              </span>
            </div>
            <Badge variant="outline" className="bg-background text-[11px]">
              Alíquota CBS: {effectiveCbs}% + IBS: {effectiveIbs}% = {aliquotaTotal.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Seção Explicativa: O que é o Split Payment & Cronologia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* O que é Split Payment */}
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">O que é o Split Payment?</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Mecanismo central de combate à sonegação introduzido pela Reforma Tributária do
              Consumo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              O <strong>Split Payment</strong> (pagamento compartilhado) é a sistemática pela qual
              as instituições financeiras, credenciadoras de cartões e operadoras do PIX recolhem o
              IBS e a CBS <strong>no exato momento da liquidação financeira</strong> da operação.
            </p>

            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-border space-y-2 text-slate-800 dark:text-slate-200">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Como muda o dia a dia financeiro:
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Antes:</strong> Sua empresa recebia 100% do valor da nota do cliente e
                  pagava os tributos (PIS, Cofins, ISS, ICMS) até o dia 20 do mês seguinte,
                  utilizando o saldo como capital de giro de curto prazo.
                </li>
                <li>
                  <strong>Com o Split:</strong> O dinheiro do imposto sequer chega à conta corrente
                  da empresa. Ao pagar um boleto ou fatura de R$ 10.000, o banco envia ~R$ 2.650
                  direto aos cofres públicos e apenas R$ 7.350 entra no caixa.
                </li>
              </ul>
            </div>

            <p>
              Por isso, empresas de consultoria e serviços precisam renegociar prazos com
              fornecedores ou reforçar linhas de capital de giro para não serem surpreendidas pela
              quebra de liquidez.
            </p>
          </CardContent>
        </Card>

        {/* Cronograma da Reforma */}
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Cronologia Oficial de Implantação</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Fases de transição conforme a Lei Complementar nº 214/2025.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-lg border border-border/50 bg-background hover:bg-muted/20 transition-colors text-xs"
              >
                <div className="flex flex-col items-center shrink-0 w-20">
                  <span className="font-bold text-foreground">{item.ano}</span>
                  <Badge
                    variant={
                      item.status === 'Atual'
                        ? 'default'
                        : item.status === 'Crítico'
                          ? 'destructive'
                          : 'outline'
                    }
                    className="text-[9px] uppercase px-1 py-0 mt-1"
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">{item.titulo}</div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default ReformaTributaria
