import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { WidgetFilters } from '@/components/dashboard/WidgetParts'
import { useWidgetFilters, isWithinPeriod } from '@/lib/dashboard-utils'
import { useMainStore } from '@/stores/main'
import { formatCurrency, cn } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'Pago', label: 'Pago' },
  { value: 'Pendente', label: 'Pendente' },
]

export function IndicatorsWidget({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { deals, transactions } = useMainStore()
  const filters = useWidgetFilters('month')

  const periodTxs = transactions.filter((t: any) => {
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.period !== 'all' && !isWithinPeriod(t.date || '', filters.range)) return false
    return true
  })

  const totalRevenue = periodTxs
    .filter((t) => t.type === 'Receita')
    .reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpenses = periodTxs
    .filter((t) => t.type === 'Despesa')
    .reduce((s, t) => s + (t.amount || 0), 0)
  const openDeals = deals.filter((d) => !['won', 'lost'].includes(d.stage))
  const pipelineValue = openDeals.reduce((s, d) => s + (d.value || 0), 0)
  const wonDeals = deals.filter((d) => d.stage === 'won').length
  const conversionRate = deals.length > 0 ? (wonDeals / deals.length) * 100 : 0

  const kpis = [
    {
      label: 'Pipeline',
      value: formatCurrency(pipelineValue),
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Conversão',
      value: `${conversionRate.toFixed(1)}%`,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      label: 'Receita',
      value: formatCurrency(totalRevenue),
      color: 'text-primary',
      bg: 'bg-primary/5',
    },
    {
      label: 'Despesa',
      value: formatCurrency(totalExpenses),
      color: 'text-destructive',
      bg: 'bg-destructive/5',
    },
  ]

  return (
    <DashboardWidget
      title="Indicadores Comerciais"
      icon={<BarChart3 className="h-4 w-4" />}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      <WidgetFilters
        period={filters.period}
        onPeriodChange={filters.setPeriod}
        customStart={filters.customStart}
        customEnd={filters.customEnd}
        onCustomDateChange={filters.handleCustomDateChange}
        status={filters.status}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={filters.setStatus}
      />
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cn('rounded-lg p-3 border', kpi.bg)}>
            <p className="text-xs text-muted-foreground font-medium mb-1">{kpi.label}</p>
            <p className={cn('text-base font-bold truncate', kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        {openDeals.length} oportunidades em aberto • {wonDeals} ganhas
      </div>
    </DashboardWidget>
  )
}
