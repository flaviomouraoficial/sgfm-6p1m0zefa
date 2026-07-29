import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { WidgetFilters, WidgetItem, Badge } from '@/components/dashboard/WidgetParts'
import { useWidgetFilters, isWithinPeriod, deriveStatusOptions } from '@/lib/dashboard-utils'
import { useMainStore } from '@/stores/main'
import { formatCurrency } from '@/lib/utils'
import { PieChart } from 'lucide-react'

const STAGE_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'contact', label: 'Contato' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'won', label: 'Ganho' },
  { value: 'lost', label: 'Perdido' },
]

export function CrmWidget({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { deals } = useMainStore()
  const filters = useWidgetFilters('all')

  const filtered = deals.filter((d: any) => {
    if (filters.status !== 'all' && d.stage !== filters.status) return false
    if (filters.period !== 'all' && !isWithinPeriod(d.created || '', filters.range)) return false
    return true
  })

  const openCount = deals.filter((d) => !['won', 'lost'].includes(d.stage)).length

  return (
    <DashboardWidget
      title="Oportunidades CRM"
      icon={<PieChart className="h-4 w-4" />}
      summary={`(${openCount} abertas)`}
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
        statusOptions={STAGE_OPTIONS}
        onStatusChange={filters.setStatus}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma oportunidade encontrada.
        </p>
      ) : (
        filtered.slice(0, 20).map((d: any) => (
          <WidgetItem
            key={d.id}
            title={d.title}
            subtitle={d.clientName}
            value={formatCurrency(d.value)}
            dateStr={d.created}
            navigateTo="/admin/funil"
            badge={
              <Badge variant="outline" className="text-[9px]">
                {d.stage}
              </Badge>
            }
          />
        ))
      )}
    </DashboardWidget>
  )
}
