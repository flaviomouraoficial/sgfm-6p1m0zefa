import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function UserAccessHistory({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    pb.collection('v1_access_logs')
      .getFullList({
        filter: `target_user_id = '${userId}'`,
        sort: '-created',
        expand: 'admin_id',
      })
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [userId])

  const renderPerms = (perms: any) => {
    if (!perms) return <span className="text-muted-foreground">-</span>
    return (
      <div className="flex flex-wrap gap-1">
        {perms.agenda && (
          <Badge variant="outline" className="text-xs">
            Agenda
          </Badge>
        )}
        {perms.links && (
          <Badge variant="outline" className="text-xs">
            Links
          </Badge>
        )}
        {perms.credits && (
          <Badge variant="outline" className="text-xs">
            Créditos
          </Badge>
        )}
        {perms.reports && (
          <Badge variant="outline" className="text-xs">
            Relatórios
          </Badge>
        )}
        {!perms.agenda && !perms.links && !perms.credits && !perms.reports && (
          <span className="text-xs text-muted-foreground">Nenhuma</span>
        )}
      </div>
    )
  }

  if (loading)
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">Carregando histórico...</div>
    )

  if (logs.length === 0)
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Nenhum registro de alteração de acesso encontrado.
      </div>
    )

  return (
    <div className="rounded-md border max-h-[400px] overflow-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Modificado Por</TableHead>
            <TableHead>Permissões Anteriores</TableHead>
            <TableHead>Novas Permissões</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs whitespace-nowrap">
                {format(new Date(log.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-xs">
                {log.expand?.admin_id?.name || log.expand?.admin_id?.email || 'Sistema'}
              </TableCell>
              <TableCell>{renderPerms(log.old_permissions)}</TableCell>
              <TableCell>{renderPerms(log.new_permissions)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
