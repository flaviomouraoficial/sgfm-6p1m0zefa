import { Lead } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Calendar, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  lead: Lead
}

export function KanbanCard({ lead }: Props) {
  const isOverdue = new Date(lead.targetDate).getTime() < new Date().getTime()
  const isApproaching =
    !isOverdue &&
    new Date(lead.targetDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000

  return (
    <Card
      draggable
      onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
      className={cn(
        'cursor-move hover:shadow-md transition-all hover:-translate-y-0.5 mb-2 group border-l-4',
        isOverdue ? 'border-l-destructive' : isApproaching ? 'border-l-accent' : 'border-l-primary',
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <span className="font-bold text-xs leading-tight text-foreground/90">{lead.name}</span>
          {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
          {isApproaching && <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0" />}
        </div>

        <div className="text-xs font-bold text-primary/90 bg-primary/5 inline-block px-1.5 py-0.5 rounded">
          R$ {lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 opacity-70" />
            <span className={cn(isOverdue && 'text-destructive font-bold')}>
              {new Date(lead.targetDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </span>
          </div>

          <div className="flex items-center space-x-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {lead.phone && (
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-600 hover:text-green-700"
                title="WhatsApp"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="text-primary hover:text-primary/80"
                title="Email"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
