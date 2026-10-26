import { useEffect, useMemo, useState } from 'react'
import {
  Calculator,
  Share2,
  Users,
  PhoneCall,
  UserCheck,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Headset,
  Handshake,
  Save,
  FolderOpen,
  Trash2,
  FileDown,
  BarChart3,
  Target,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })

const fmtInt = (v: number) => Math.round(v).toLocaleString('pt-BR')

const fmtPercent = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`

const STORAGE_KEY = 'calculadora-cenarios'

interface ResultadosFunil {
  leads: number
  agendamentos: number
  comparecimentos: number
  vendas: number
  faturamento: number
  custoPorCall: number
  cac: number
  roas: number
  sdrs: number
  closers: number
  lucro: number
}

interface ValoresCenario {
  investimento: number
  precoLead: number
  taxaAgendamento: number
  taxaComparecimento: number
  taxaConversao: number
  ticketMedio: number
}

interface CenarioSalvo {
  id: string
  nome: string
  data: string
  valores: ValoresCenario
  metaFaturamento?: number
}

const DEFAULT_VALORES: ValoresCenario = {
  investimento: 10000,
  precoLead: 20,
  taxaAgendamento: 15,
  taxaComparecimento: 60,
  taxaConversao: 20,
  ticketMedio: 3000,
}

function carregarCenarios(): CenarioSalvo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as CenarioSalvo[]
    return []
  } catch {
    return []
  }
}

function salvarCenarios(cenarios: CenarioSalvo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cenarios))
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ElementType
  positive: boolean
  hint?: string
}

function MetricCard({ title, value, icon: Icon, positive, hint }: MetricCardProps) {
  return (
    <Card
      className="relative overflow-hidden border-l-4 shadow-sm"
      style={{ borderLeftColor: positive ? '#16a34a' : '#dc2626' }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full',
            positive
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}

function SliderInput({ label, value, min, max, step, onChange, display }: SliderInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary tabular-nums">
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(arr) => onChange(arr[0])}
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{min.toLocaleString('pt-BR')}</span>
        <span>{max.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  )
}

interface BarChartProps {
  investimento: number
  faturamento: number
  lucro: number
}

function BarChart({ investimento, faturamento, lucro }: BarChartProps) {
  const bars = [
    { label: 'Investimento', value: investimento, color: 'bg-blue-500' },
    { label: 'Faturamento', value: faturamento, color: 'bg-emerald-500' },
    { label: 'Custo Total', value: investimento, color: 'bg-amber-500' },
    { label: 'Lucro', value: lucro, color: lucro >= 0 ? 'bg-green-600' : 'bg-red-600' },
  ]

  const maxValue = Math.max(...bars.map((b) => Math.abs(b.value)), 1)
  const valorValido = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0)

  return (
    <div className="space-y-4">
      {bars.map((bar) => {
        const widthPct = Math.max((valorValido(bar.value) / maxValue) * 100, 2)
        return (
          <div key={bar.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{bar.label}</span>
              <span className="font-bold tabular-nums text-muted-foreground">
                {fmtCurrency(bar.value)}
              </span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-md bg-muted">
              <div
                className={cn('h-full rounded-md transition-all duration-300', bar.color)}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Calculadora() {
  const { toast } = useToast()

  const [investimento, setInvestimento] = useState(DEFAULT_VALORES.investimento)
  const [precoLead, setPrecoLead] = useState(DEFAULT_VALORES.precoLead)
  const [taxaAgendamento, setTaxaAgendamento] = useState(DEFAULT_VALORES.taxaAgendamento)
  const [taxaComparecimento, setTaxaComparecimento] = useState(DEFAULT_VALORES.taxaComparecimento)
  const [taxaConversao, setTaxaConversao] = useState(DEFAULT_VALORES.taxaConversao)
  const [ticketMedio, setTicketMedio] = useState(DEFAULT_VALORES.ticketMedio)

  const [salvarOpen, setSalvarOpen] = useState(false)
  const [nomeCenario, setNomeCenario] = useState('')
  const [cenarios, setCenarios] = useState<CenarioSalvo[]>([])
  const [metaFaturamento, setMetaFaturamento] = useState(0)

  const results = useMemo(() => {
    const leads = precoLead > 0 ? investimento / precoLead : 0
    const agendamentos = leads * (taxaAgendamento / 100)
    const comparecimentos = agendamentos * (taxaComparecimento / 100)
    const vendas = comparecimentos * (taxaConversao / 100)
    const faturamento = vendas * ticketMedio
    const custoPorCall = agendamentos > 0 ? investimento / agendamentos : 0
    const cac = vendas > 0 ? investimento / vendas : 0
    const roas = investimento > 0 ? faturamento / investimento : 0
    const sdrs = Math.ceil(leads / 750)
    const closers = Math.ceil(comparecimentos / 90)
    const lucro = faturamento - investimento

    return {
      leads,
      agendamentos,
      comparecimentos,
      vendas,
      faturamento,
      custoPorCall,
      cac,
      roas,
      sdrs,
      closers,
      lucro,
    }
  }, [investimento, precoLead, taxaAgendamento, taxaComparecimento, taxaConversao, ticketMedio])

  useEffect(() => {
    setCenarios(carregarCenarios())
  }, [])

  const handleShareWhatsApp = () => {
    const msg = [
      '*📊 Calculadora Comercial — SGFM*',
      '',
      `*Investimento/mês:* ${fmtCurrency(investimento)}`,
      `*Preço por Lead:* ${fmtCurrency(precoLead)}`,
      `*Taxa de Agendamento:* ${fmtPercent(taxaAgendamento)}`,
      `*Taxa de Comparecimento:* ${fmtPercent(taxaComparecimento)}`,
      `*Taxa de Conversão:* ${fmtPercent(taxaConversao)}`,
      `*Ticket Médio:* ${fmtCurrency(ticketMedio)}`,
      '',
      '*Resultados:*',
      `🔹 Leads gerados: ${fmtInt(results.leads)}`,
      `🔹 Agendamentos: ${fmtInt(results.agendamentos)}`,
      `🔹 Comparecimentos: ${fmtInt(results.comparecimentos)}`,
      `🔹 Vendas: ${fmtInt(results.vendas)}`,
      `🔹 Faturamento: ${fmtCurrency(results.faturamento)}`,
      `🔹 Custo por Call: ${fmtCurrency(results.custoPorCall)}`,
      `🔹 CAC: ${fmtCurrency(results.cac)}`,
      `🔹 ROAS: ${results.roas.toFixed(2)}x`,
      `🔹 SDRs: ${results.sdrs}`,
      `🔹 Closers: ${results.closers}`,
    ].join('\n')

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleReset = () => {
    setInvestimento(DEFAULT_VALORES.investimento)
    setPrecoLead(DEFAULT_VALORES.precoLead)
    setTaxaAgendamento(DEFAULT_VALORES.taxaAgendamento)
    setTaxaComparecimento(DEFAULT_VALORES.taxaComparecimento)
    setTaxaConversao(DEFAULT_VALORES.taxaConversao)
    setTicketMedio(DEFAULT_VALORES.ticketMedio)
    setMetaFaturamento(0)
    toast({ description: 'Valores redefinidos para o padrão.' })
  }

  const handleSalvarCenario = () => {
    const nome = nomeCenario.trim()
    if (!nome) {
      toast({ variant: 'destructive', description: 'Informe um nome para o cenário.' })
      return
    }
    const novo: CenarioSalvo = {
      id: `${Date.now()}`,
      nome,
      data: new Date().toLocaleString('pt-BR'),
      valores: {
        investimento,
        precoLead,
        taxaAgendamento,
        taxaComparecimento,
        taxaConversao,
        ticketMedio,
      },
      metaFaturamento,
    }
    const atualizados = [novo, ...cenarios]
    salvarCenarios(atualizados)
    setCenarios(atualizados)
    setNomeCenario('')
    setSalvarOpen(false)
    toast({ description: `Cenário "${nome}" salvo com sucesso.` })
  }

  const handleCarregarCenario = (cenario: CenarioSalvo) => {
    const v = cenario.valores
    setInvestimento(v.investimento)
    setPrecoLead(v.precoLead)
    setTaxaAgendamento(v.taxaAgendamento)
    setTaxaComparecimento(v.taxaComparecimento)
    setTaxaConversao(v.taxaConversao)
    setTicketMedio(v.ticketMedio)
    setMetaFaturamento(cenario.metaFaturamento ?? 0)
    toast({ description: `Cenário "${cenario.nome}" carregado.` })
  }

  const handleExcluirCenario = (id: string) => {
    const atualizados = cenarios.filter((c) => c.id !== id)
    salvarCenarios(atualizados)
    setCenarios(atualizados)
    toast({ description: 'Cenário excluído.' })
  }

  const handleExportPDF = () => {
    toast({ description: 'Preparando documento para impressão...' })
    // Pequeno atraso para garantir renderização do bloco de impressão
    setTimeout(() => window.print(), 250)
  }

  const dataSimulacao = new Date().toLocaleString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Calculator className="h-6 w-6 text-primary" />
            Calculadora Comercial
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Simule o funil de vendas ajustando as variáveis de investimento e taxas de conversão.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleReset}>
            Redefinir
          </Button>
          <Button variant="outline" onClick={() => setSalvarOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Cenário
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                Carregar Cenário
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Cenários Salvos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {cenarios.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Nenhum cenário salvo.
                </div>
              ) : (
                cenarios.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    className="flex items-center justify-between gap-2"
                    onSelect={(e) => {
                      e.preventDefault()
                      handleCarregarCenario(c)
                    }}
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium">{c.nome}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{c.data}</span>
                    </div>
                    <button
                      type="button"
                      className="ml-2 rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-950"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleExcluirCenario(c.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar no WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Sliders */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Variáveis de Entrada</CardTitle>
            <CardDescription>Ajuste os sliders para recalcular em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderInput
              label="Investimento por Mês"
              value={investimento}
              min={1000}
              max={100000}
              step={500}
              onChange={setInvestimento}
              display={fmtCurrency(investimento)}
            />
            <SliderInput
              label="Preço por Lead"
              value={precoLead}
              min={1}
              max={200}
              step={1}
              onChange={setPrecoLead}
              display={fmtCurrency(precoLead)}
            />
            <SliderInput
              label="Taxa de Agendamento"
              value={taxaAgendamento}
              min={5}
              max={30}
              step={1}
              onChange={setTaxaAgendamento}
              display={fmtPercent(taxaAgendamento)}
            />
            <SliderInput
              label="Taxa de Comparecimento"
              value={taxaComparecimento}
              min={30}
              max={85}
              step={1}
              onChange={setTaxaComparecimento}
              display={fmtPercent(taxaComparecimento)}
            />
            <SliderInput
              label="Taxa de Conversão"
              value={taxaConversao}
              min={5}
              max={40}
              step={1}
              onChange={setTaxaConversao}
              display={fmtPercent(taxaConversao)}
            />
            <SliderInput
              label="Ticket Médio"
              value={ticketMedio}
              min={100}
              max={300000}
              step={100}
              onChange={setTicketMedio}
              display={fmtCurrency(ticketMedio)}
            />
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="space-y-6">
          <div className="print:hidden">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Resultados do Funil
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                title="Leads Gerados"
                value={fmtInt(results.leads)}
                icon={Users}
                positive={results.leads > 0}
                hint="Investimento ÷ Preço por Lead"
              />
              <MetricCard
                title="Agendamentos"
                value={fmtInt(results.agendamentos)}
                icon={PhoneCall}
                positive={results.agendamentos > 0}
                hint="Leads × Taxa de Agendamento"
              />
              <MetricCard
                title="Comparecimentos"
                value={fmtInt(results.comparecimentos)}
                icon={UserCheck}
                positive={results.comparecimentos > 0}
                hint="Agendamentos × Taxa de Comparecimento"
              />
              <MetricCard
                title="Vendas"
                value={fmtInt(results.vendas)}
                icon={ShoppingCart}
                positive={results.vendas > 0}
                hint="Comparecimentos × Taxa de Conversão"
              />
              <MetricCard
                title="Faturamento"
                value={fmtCurrency(results.faturamento)}
                icon={DollarSign}
                positive={results.faturamento > investimento}
                hint="Vendas × Ticket Médio"
              />
              <MetricCard
                title="ROAS"
                value={`${results.roas.toFixed(2)}x`}
                icon={TrendingUp}
                positive={results.roas >= 1}
                hint="Faturamento ÷ Investimento"
              />
            </div>
          </div>

          <div className="print:hidden">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Custos & Equipe
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Custo por Call"
                value={fmtCurrency(results.custoPorCall)}
                icon={PhoneCall}
                positive={results.custoPorCall <= precoLead * 5}
                hint="Investimento ÷ Agendamentos"
              />
              <MetricCard
                title="CAC"
                value={fmtCurrency(results.cac)}
                icon={Users}
                positive={results.cac <= ticketMedio * 0.3}
                hint="Investimento ÷ Vendas"
              />
              <MetricCard
                title="Nº de SDRs"
                value={String(results.sdrs)}
                icon={Headset}
                positive={results.sdrs > 0}
                hint="teto(Leads ÷ 750)"
              />
              <MetricCard
                title="Nº de Closers"
                value={String(results.closers)}
                icon={Handshake}
                positive={results.closers > 0}
                hint="teto(Comparecimentos ÷ 90)"
              />
            </div>
          </div>

          {/* Gráfico de barras comparativo */}
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Comparativo Financeiro
              </CardTitle>
              <CardDescription>
                Investimento, Faturamento, Custo Total e Lucro lado a lado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                investimento={investimento}
                faturamento={results.faturamento}
                lucro={results.lucro}
              />
            </CardContent>
          </Card>

          <MetaFaturamentoCard
            faturamento={results.faturamento}
            meta={metaFaturamento}
            onMetaChange={setMetaFaturamento}
          />
        </div>
      </div>

      {/* Modal: Salvar Cenário */}
      <Dialog open={salvarOpen} onOpenChange={setSalvarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Salvar Cenário
            </DialogTitle>
            <DialogDescription>
              Dê um nome a este cenário para carregá-lo novamente depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input
              autoFocus
              placeholder="Ex.: Campanha Q1 - Ticket Alto"
              value={nomeCenario}
              onChange={(e) => setNomeCenario(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSalvarCenario()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalvarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarCenario}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conteúdo exclusivo para impressão / PDF */}
      <div className="hidden print:block">
        <PrintLayout
          dataSimulacao={dataSimulacao}
          valores={{
            investimento,
            precoLead,
            taxaAgendamento,
            taxaComparecimento,
            taxaConversao,
            ticketMedio,
          }}
          results={results}
        />
      </div>
    </div>
  )
}

interface MetaFaturamentoCardProps {
  faturamento: number
  meta: number
  onMetaChange: (v: number) => void
}

function MetaFaturamentoCard({ faturamento, meta, onMetaChange }: MetaFaturamentoCardProps) {
  const metaValida = meta > 0
  const pct = metaValida ? Math.min((faturamento / meta) * 100, 100) : 0
  const atingiu = metaValida && faturamento >= meta
  const perto = metaValida && !atingiu && pct >= 70

  const barColor = atingiu ? 'bg-green-600' : perto ? 'bg-blue-600' : 'bg-amber-500'

  const textColor = atingiu
    ? 'text-green-700 dark:text-green-400'
    : perto
      ? 'text-blue-700 dark:text-blue-400'
      : 'text-amber-700 dark:text-amber-400'

  const diferenca = metaValida ? faturamento - meta : 0

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Meta de Faturamento
        </CardTitle>
        <CardDescription>
          Defina uma meta mensal e acompanhe o progresso do faturamento calculado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Meta de Faturamento Mensal (R$)
          </label>
          <Input
            type="number"
            min={0}
            step={100}
            placeholder="Ex.: 50000"
            value={metaValida ? meta : ''}
            onChange={(e) => {
              const v = e.target.value
              onMetaChange(v === '' ? 0 : Math.max(0, Number(v)))
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Faturamento Atual</p>
            <p className="text-lg font-bold tabular-nums">{fmtCurrency(faturamento)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Meta Definida</p>
            <p className="text-lg font-bold tabular-nums">{metaValida ? fmtCurrency(meta) : '—'}</p>
          </div>
        </div>

        {metaValida ? (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Progresso</span>
                <span className={cn('font-bold tabular-nums', textColor)}>{fmtPercent(pct)}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', barColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div
              className={cn(
                'rounded-lg border p-3 text-sm font-medium',
                atingiu
                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                  : perto
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
                textColor,
              )}
            >
              {atingiu
                ? `Meta atingida! Superou em ${fmtCurrency(diferenca)}.`
                : `Faltam ${fmtCurrency(Math.abs(diferenca))} para atingir a meta.`}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Informe um valor de meta acima de zero para acompanhar o progresso.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function PrintLayout({
  dataSimulacao,
  valores,
  results,
}: {
  dataSimulacao: string
  valores: ValoresCenario
  results: ResultadosFunil
}) {
  const parametros = [
    { label: 'Investimento por Mês', valor: fmtCurrency(valores.investimento) },
    { label: 'Preço por Lead', valor: fmtCurrency(valores.precoLead) },
    { label: 'Taxa de Agendamento', valor: fmtPercent(valores.taxaAgendamento) },
    { label: 'Taxa de Comparecimento', valor: fmtPercent(valores.taxaComparecimento) },
    { label: 'Taxa de Conversão', valor: fmtPercent(valores.taxaConversao) },
    { label: 'Ticket Médio', valor: fmtCurrency(valores.ticketMedio) },
  ]

  const metricas = [
    { label: 'Leads Gerados', valor: fmtInt(results.leads) },
    { label: 'Agendamentos', valor: fmtInt(results.agendamentos) },
    { label: 'Comparecimentos', valor: fmtInt(results.comparecimentos) },
    { label: 'Vendas', valor: fmtInt(results.vendas) },
    { label: 'Faturamento', valor: fmtCurrency(results.faturamento) },
    { label: 'Custo por Call', valor: fmtCurrency(results.custoPorCall) },
    { label: 'CAC', valor: fmtCurrency(results.cac) },
    { label: 'ROAS', valor: `${results.roas.toFixed(2)}x` },
    { label: 'Nº de SDRs', valor: String(results.sdrs) },
    { label: 'Nº de Closers', valor: String(results.closers) },
  ]

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#111' }}>
      <div
        style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '12px', marginBottom: '16px' }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>
          Simulação Comercial - Grupo Flávio Moura
        </h1>
        <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
          Data da simulação: {dataSimulacao}
        </p>
      </div>

      <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px' }}>
        Parâmetros de Entrada
      </h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '20px',
          fontSize: '13px',
        }}
      >
        <tbody>
          {parametros.map((p) => (
            <tr key={p.label} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 8px', color: '#374151' }}>{p.label}</td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'right' }}>
                {p.valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px' }}>
        Resultados Calculados
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Métrica</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {metricas.map((m, i) => (
            <tr key={m.label} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
              <td style={{ padding: '6px 8px', color: '#374151' }}>{m.label}</td>
              <td style={{ padding: '6px 8px', fontWeight: 'bold', textAlign: 'right' }}>
                {m.valor}
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid #1e3a8a', backgroundColor: '#eff6ff' }}>
            <td style={{ padding: '8px', fontWeight: 'bold', color: '#1e3a8a' }}>
              Lucro (Faturamento - Investimento)
            </td>
            <td
              style={{
                padding: '8px',
                fontWeight: 'bold',
                textAlign: 'right',
                color: results.lucro >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {fmtCurrency(results.lucro)}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '24px', textAlign: 'center' }}>
        Documento gerado pela Calculadora Comercial — SGFM | Grupo Flávio Moura
      </p>
    </div>
  )
}
