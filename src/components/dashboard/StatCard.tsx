import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  icon: ReactNode
  trend?: string
  isPositive?: boolean
}

export function StatCard({ title, value, icon, trend, isPositive }: StatCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive ? 'text-green-600' : 'text-destructive',
                )}
              >
                {trend} em relação ao mês anterior
              </span>
            )}
          </div>
          <div className="p-3 bg-accent/10 rounded-full text-accent">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
