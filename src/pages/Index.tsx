import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { useRealtime } from '@/hooks/use-realtime'
import { useDashboardPrefs } from '@/hooks/use-dashboard-prefs'
import { getPeriodRange, isWithinPeriod, type PeriodType } from '@/lib/dashboard-utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings } from 'lucide-react'
import { IndicatorCards } from '@/components/dashboard/IndicatorCards'
import { WidgetSettingsDialog } from '@/components/dashboard/WidgetParts'
import { CrmWidget } from '@/components/dashboard/widgets/CrmWidget'
import { TransactionWidget } from '@/components/dashboard/widgets/TransactionWidget'
import { ProposalsWidget } from '@/components/dashboard/widgets/ProposalsWidget'
import { TasksWidget } from '@/components/dashboard/widgets/TasksWidget'
import { IndicatorsWidget } from '@/components/dashboard/widgets/IndicatorsWidget'

export default function Index() {
  const { transactions, deals, clientSessions, fetchProposals } = useMainStore()
  const { visible, collapsed, toggleWidget, toggleCollapse } = useDashboardPrefs()
  const [globalPeriod, setGlobalPeriod] = useState<PeriodType>('month')
  const [settingsOpen, setSettingsOpen] = useState(false)

  useRealtime('v1_proposals', () => fetchProposals())

  const globalRange = useMemo(() => getPeriodRange(globalPeriod), [globalPeriod])

  const periodLabel =
    globalPeriod === 'today'
      ? 'Hoje'
      : globalPeriod === 'week'
        ? 'Esta semana'
        : globalPeriod === 'month'
          ? 'Este mês'
          : globalPeriod === 'all'
            ? 'Todo período'
            : 'Personalizado'

  const periodTxs = transactions.filter((t: any) => isWithinPeriod(t.date || '', globalRange))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Painel Gerencial</h1>
          <p className="text-muted-foreground mt-1">Visão estratégica em tempo real do negócio.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={globalPeriod} onValueChange={(v) => setGlobalPeriod(v as PeriodType)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            title="Configurar widgets"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <IndicatorCards
        transactions={periodTxs}
        deals={deals}
        sessions={clientSessions}
        periodLabel={periodLabel}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.crm && (
          <CrmWidget collapsed={collapsed.crm} onToggleCollapse={() => toggleCollapse('crm')} />
        )}
        {visible.receivable && (
          <TransactionWidget
            type="Receita"
            collapsed={collapsed.receivable}
            onToggleCollapse={() => toggleCollapse('receivable')}
          />
        )}
        {visible.payable && (
          <TransactionWidget
            type="Despesa"
            collapsed={collapsed.payable}
            onToggleCollapse={() => toggleCollapse('payable')}
          />
        )}
        {visible.proposals && (
          <ProposalsWidget
            collapsed={collapsed.proposals}
            onToggleCollapse={() => toggleCollapse('proposals')}
          />
        )}
        {visible.tasks && (
          <TasksWidget
            collapsed={collapsed.tasks}
            onToggleCollapse={() => toggleCollapse('tasks')}
          />
        )}
        {visible.indicators && (
          <IndicatorsWidget
            collapsed={collapsed.indicators}
            onToggleCollapse={() => toggleCollapse('indicators')}
          />
        )}
      </div>

      <WidgetSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        visible={visible}
        onToggle={toggleWidget}
      />
    </div>
  )
}
