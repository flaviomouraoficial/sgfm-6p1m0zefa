import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, Mail, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationLogs() {
  const { notificationLogs } = useMainStore()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return notificationLogs
      .filter((log) => log.menteeName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [notificationLogs, search])

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="bg-muted/10 border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle className="text-base">Histórico de Notificações</CardTitle>
          <CardDescription className="text-xs">
            Registro completo de todos os lembretes de sessão disparados.
          </CardDescription>
        </div>
        <div className="relative w-full sm:w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mentorado..."
            className="pl-8 h-9 text-xs bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Mentorado</TableHead>
              <TableHead>Data da Sessão</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Horário de Envio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhum log de notificação encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-sm">{log.menteeName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.sessionDate).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {log.channel === 'E-mail' ? (
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {log.channel}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-2 font-medium',
                        log.status === 'Entregue' && 'bg-green-50 text-green-700 border-green-200',
                        log.status === 'Enviado' && 'bg-blue-50 text-blue-700 border-blue-200',
                        log.status === 'Falha' && 'bg-red-50 text-red-700 border-red-200',
                      )}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
