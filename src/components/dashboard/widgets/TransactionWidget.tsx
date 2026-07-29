import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { WidgetFilters, WidgetItem, Badge } from '@/components/dashboard/WidgetParts'
import { useWidgetFilters, isWithinPeriod } from '@/lib/dashboard-utils'
import { useMainStore } from '@/stores/main'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'Pago', label: 'Pago' },
  { value: 'Pendente', label: 'Pendente' },
]

export function TransactionWidget({
  type,
  collapsed,
  onToggleCollapse,
}: {
  type: 'Receita' | 'Despesa'
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { transactions } = useMainStore()
  const filters = useWidgetFilters('month')

  const filtered = transactions.filter((t: any) => {
    if (t.type !== type) return false
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.period !== 'all' && !isWithinPeriod(t.date || '', filters.range)) return false
    return true
  })

  const pendingCount = transactions.filter((t) => t.type === type && t.status === 'Pendente').length

  const title = type === 'Receita' ? 'Contas a Receber' : 'Contas a Pagar'
  const icon =
    type === 'Receita' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />

  return (
    <DashboardWidget
      title={title}
      icon={icon}
      summary={`(${pendingCount} pendentes)`}
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
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum lançamento encontrado.
        </p>
      ) : (
        filtered.slice(0, 20).map((t: any) => (
          <WidgetItem
            key={t.id}
            title={t.description}
            subtitle={t.category}
            value={`${type === 'Receita' ? '+' : '-'} ${formatCurrency(t.amount)}`}
            dateStr={t.date}
            alertDate={t.status === 'Pendente' ? t.date : undefined}
            navigateTo="/admin/financeiro"
            badge={
              <Badge variant={t.status === 'Pago' ? 'default' : 'outline'} className="text-[9px]">
                {t.status}
              </Badge>
            }
          />
        ))
      )}
    </DashboardWidget>
  )
}
