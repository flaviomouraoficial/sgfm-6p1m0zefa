import { useNavigate } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getAlertLevel, formatDateBR, type PeriodType } from '@/lib/dashboard-utils'
import { WIDGET_LABELS, type WidgetId } from '@/hooks/use-dashboard-prefs'

export function WidgetFilters({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomDateChange,
  status,
  statusOptions,
  onStatusChange,
}: {
  period: PeriodType
  onPeriodChange: (v: PeriodType) => void
  customStart?: string
  customEnd?: string
  onCustomDateChange?: (field: 'start' | 'end', value: string) => void
  status: string
  statusOptions: { value: string; label: string }[]
  onStatusChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodType)}>
        <SelectTrigger className="h-8 w-[105px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo período</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="week">Semana</SelectItem>
          <SelectItem value="month">Mês</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {period === 'custom' && (
        <>
          <Input
            type="date"
            value={customStart || ''}
            onChange={(e) => onCustomDateChange?.('start', e.target.value)}
            className="h-8 w-[130px] text-xs"
          />
          <Input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onCustomDateChange?.('end', e.target.value)}
            className="h-8 w-[130px] text-xs"
          />
        </>
      )}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-[105px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function WidgetItem({
  title,
  subtitle,
  value,
  dateStr,
  alertDate,
  navigateTo,
  badge,
}: {
  title: string
  subtitle?: string
  value?: string
  dateStr?: string
  alertDate?: string
  navigateTo?: string
  badge?: React.ReactNode
}) {
  const navigate = useNavigate()
  const alert = getAlertLevel(alertDate)
  return (
    <div
      onClick={() => navigateTo && navigate(navigateTo)}
      className={cn(
        'flex items-center justify-between p-2.5 rounded-md border transition-all mb-1.5',
        navigateTo && 'cursor-pointer hover:bg-muted/50 hover:shadow-sm',
        alert === 'overdue' && 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20',
        alert === 'upcoming' && 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
        alert === 'normal' && 'border-l-4 border-l-transparent',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        {value && <span className="text-sm font-bold text-foreground">{value}</span>}
        {badge}
        {dateStr && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatDateBR(dateStr)}
          </span>
        )}
      </div>
    </div>
  )
}

export function WidgetSettingsDialog({
  open,
  onOpenChange,
  visible,
  onToggle,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  visible: Record<WidgetId, boolean>
  onToggle: (id: WidgetId) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configurar Widgets</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {(Object.keys(WIDGET_LABELS) as WidgetId[]).map((id) => (
            <div key={id} className="flex items-center justify-between">
              <Label htmlFor={`widget-${id}`} className="text-sm">
                {WIDGET_LABELS[id]}
              </Label>
              <Switch
                id={`widget-${id}`}
                checked={visible[id]}
                onCheckedChange={() => onToggle(id)}
              />
            </div>
          ))}
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="w-full">
            Fechar
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

export { Badge }
