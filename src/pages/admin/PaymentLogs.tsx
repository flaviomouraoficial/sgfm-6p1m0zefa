import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye, Activity } from 'lucide-react'

export default function PaymentLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const fetchLogs = async () => {
    try {
      let filter = ''
      if (statusFilter !== 'all') {
        filter = `status = '${statusFilter}'`
      }
      const records = await pb.collection('v1_webhook_logs').getList(1, 50, {
        sort: '-created',
        filter,
      })
      setLogs(records.items)
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [statusFilter])

  useRealtime(
    'v1_webhook_logs',
    (e) => {
      if (e.action === 'create') {
        if (statusFilter === 'all' || e.record.status === statusFilter) {
          setLogs((prev) => [e.record, ...prev].slice(0, 50))
        }
      } else if (e.action === 'update') {
        setLogs((prev) => prev.map((l) => (l.id === e.record.id ? e.record : l)))
      } else if (e.action === 'delete') {
        setLogs((prev) => prev.filter((l) => l.id !== e.record.id))
      }
    },
    true,
  )

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">
            Sucesso
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-200">
            Erro
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-200">
            Pendente
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1e3a8a] flex items-center gap-2">
          <Activity className="w-8 h-8" /> Logs de Pagamento
        </h2>
        <p className="text-muted-foreground">Monitore os webhooks do gateway de pagamento.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Histórico de Webhooks</CardTitle>
            <CardDescription>Últimas 50 requisições recebidas</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Código HTTP</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                      Nenhum log encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {new Date(log.created).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="capitalize">{log.provider}</TableCell>
                      <TableCell>{log.event_type}</TableCell>
                      <TableCell>{renderStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <span className={log.status_code >= 400 ? 'text-red-500 font-bold' : ''}>
                          {log.status_code || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="w-4 h-4 mr-2" /> Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook</DialogTitle>
            <DialogDescription>
              Evento recebido em{' '}
              {selectedLog && new Date(selectedLog.created).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Provedor</p>
                <p className="capitalize">{selectedLog?.provider}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Evento</p>
                <p>{selectedLog?.event_type}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Status</p>
                <p>{selectedLog && renderStatusBadge(selectedLog.status)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Código HTTP</p>
                <p>{selectedLog?.status_code || '-'}</p>
              </div>
            </div>

            {selectedLog?.error_message && (
              <div className="p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
                <p className="font-semibold text-sm">Mensagem de Erro</p>
                <p className="text-sm break-all">{selectedLog.error_message}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Payload JSON</p>
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap">
                {selectedLog?.payload
                  ? JSON.stringify(selectedLog.payload, null, 2)
                  : 'Sem payload'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
