import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { WidgetFilters, WidgetItem, Badge } from '@/components/dashboard/WidgetParts'
import { useWidgetFilters, isWithinPeriod } from '@/lib/dashboard-utils'
import { useMainStore } from '@/stores/main'
import { formatCurrency, cn } from '@/lib/utils'
import { FileText } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'em análise', label: 'Em Análise' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
]

export function ProposalsWidget({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { proposals } = useMainStore()
  const filters = useWidgetFilters('all')

  const filtered = proposals.filter((p: any) => {
    if (filters.status !== 'all' && p.status !== filters.status) return false
    if (filters.period !== 'all' && !isWithinPeriod(p.expirationDate || '', filters.range))
      return false
    return true
  })

  const activeCount = proposals.filter((p: any) => !['reprovado'].includes(p.status)).length

  return (
    <DashboardWidget
      title="Propostas"
      icon={<FileText className="h-4 w-4" />}
      summary={`(${activeCount} ativas)`}
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
          Nenhuma proposta encontrada.
        </p>
      ) : (
        filtered.slice(0, 20).map((p: any) => (
          <WidgetItem
            key={p.id}
            title={p.title}
            subtitle={formatCurrency(p.value)}
            dateStr={p.expirationDate}
            alertDate={p.expirationDate}
            navigateTo="/admin/propostas"
            badge={
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px]',
                  p.status === 'aprovado' && 'border-green-500 text-green-600',
                  p.status === 'reprovado' && 'border-destructive text-destructive',
                  p.status === 'em análise' && 'border-yellow-500 text-yellow-600',
                )}
              >
                {p.status}
              </Badge>
            }
          />
        ))
      )}
    </DashboardWidget>
  )
}
