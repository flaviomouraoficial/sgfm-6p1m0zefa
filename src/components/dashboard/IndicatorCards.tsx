import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Target, CheckSquare } from 'lucide-react'
import type { Transaction, Deal, Session } from '@/lib/types'

export function IndicatorCards({
  transactions,
  deals,
  sessions,
  periodLabel,
}: {
  transactions: Transaction[]
  deals: Deal[]
  sessions: Session[]
  periodLabel: string
}) {
  const totalReceivable = transactions
    .filter((t) => t.type === 'Receita')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalPayable = transactions
    .filter((t) => t.type === 'Despesa')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const openOpportunities = deals.filter((d) => !['won', 'lost'].includes(d.stage)).length

  const pendingTasks = sessions.filter(
    (s) =>
      s.tasks &&
      s.tasks.trim() &&
      !['concluido', 'completed', 'done'].includes((s.status || '').toLowerCase()),
  ).length

  const cards = [
    {
      label: 'A Receber',
      value: formatCurrency(totalReceivable),
      icon: TrendingUp,
      color: 'text-primary',
      border: 'border-l-primary',
    },
    {
      label: 'A Pagar',
      value: formatCurrency(totalPayable),
      icon: TrendingDown,
      color: 'text-destructive',
      border: 'border-l-destructive',
    },
    {
      label: 'Oportunidades',
      value: String(openOpportunities),
      icon: Target,
      color: 'text-blue-600',
      border: 'border-l-blue-500',
    },
    {
      label: 'Tarefas Pendentes',
      value: String(pendingTasks),
      icon: CheckSquare,
      color: 'text-amber-600',
      border: 'border-l-amber-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={cn('shadow-sm border-l-4', card.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
            <p className={cn('text-lg font-bold truncate', card.color)}>{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{periodLabel}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
