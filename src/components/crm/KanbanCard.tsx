import { Lead } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Calendar, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  lead: Lead
}

export function KanbanCard({ lead }: Props) {
  const isOverdue = new Date(lead.targetDate) < new Date()
  const isApproaching =
    !isOverdue &&
    new Date(lead.targetDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000

  return (
    <Card
      draggable
      onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
      className="cursor-move hover:shadow-md transition-all hover:-translate-y-0.5 mb-3 group"
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <span className="font-semibold text-sm leading-tight">{lead.name}</span>
          {isOverdue && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
          {isApproaching && <AlertCircle className="w-4 h-4 text-accent shrink-0" />}
        </div>

        <div className="text-sm font-bold text-primary">
          R$ {lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span className={cn(isOverdue && 'text-destructive font-medium')}>
              {new Date(lead.targetDate).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={`https://wa.me/${lead.phone}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-600"
            >
              <Phone className="w-3 h-3" />
            </a>
            <a href={`mailto:contato@exemplo.com`} className="hover:text-primary">
              <Mail className="w-3 h-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
