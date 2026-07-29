import { DashboardWidget } from '@/components/dashboard/DashboardWidget'
import { WidgetFilters, WidgetItem, Badge } from '@/components/dashboard/WidgetParts'
import { useWidgetFilters, isWithinPeriod, deriveStatusOptions } from '@/lib/dashboard-utils'
import { useMainStore } from '@/stores/main'
import { ClipboardList } from 'lucide-react'

export function TasksWidget({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { clientSessions } = useMainStore()
  const filters = useWidgetFilters('month')

  const taskSessions = clientSessions.filter(
    (s: any) =>
      s.tasks &&
      s.tasks.trim() &&
      !['concluido', 'completed', 'done'].includes((s.status || '').toLowerCase()),
  )

  const statusOptions = deriveStatusOptions(taskSessions, 'status')

  const filtered = taskSessions.filter((s: any) => {
    if (filters.status !== 'all' && s.status !== filters.status) return false
    if (filters.period !== 'all' && !isWithinPeriod(s.date || '', filters.range)) return false
    return true
  })

  const pendingCount = taskSessions.length

  return (
    <DashboardWidget
      title="Tarefas da Equipe"
      icon={<ClipboardList className="h-4 w-4" />}
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
        statusOptions={statusOptions}
        onStatusChange={filters.setStatus}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma tarefa pendente encontrada.
        </p>
      ) : (
        filtered.slice(0, 20).map((s: any) => {
          const responsible =
            s.expand?.mentee_id?.name || s.expand?.client_id?.name || 'Não atribuído'
          return (
            <WidgetItem
              key={s.id}
              title={s.tasks}
              subtitle={responsible}
              dateStr={s.date}
              alertDate={s.date}
              navigateTo="/admin/prontuarios"
              badge={
                s.status ? (
                  <Badge variant="outline" className="text-[9px]">
                    {s.status}
                  </Badge>
                ) : undefined
              }
            />
          )
        })
      )}
    </DashboardWidget>
  )
}
