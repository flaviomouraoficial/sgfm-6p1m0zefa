import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardWidget({
  title,
  icon,
  summary,
  collapsed,
  onToggleCollapse,
  children,
  error,
}: {
  title: string
  icon: React.ReactNode
  summary?: React.ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
  children: React.ReactNode
  error?: string | null
}) {
  return (
    <Card className="shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary shrink-0">{icon}</span>
          <CardTitle className="text-sm font-semibold truncate">{title}</CardTitle>
          {summary && <span className="text-xs text-muted-foreground shrink-0">{summary}</span>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onToggleCollapse}>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', collapsed && '-rotate-90')}
          />
        </Button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="flex-1 pt-0">
          {error ? (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-3">{children}</ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  )
}
