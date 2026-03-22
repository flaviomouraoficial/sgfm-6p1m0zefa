import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Transaction, Proposal, Deal, TimeSlot } from '@/lib/types'

export function GeneralReports({
  activeTab,
  pagedTxs,
  pagedProps,
  pagedSlots,
  deals,
  filteredTxsLength,
  filteredPropsLength,
  filteredSlotsLength,
  page,
  setPage,
  itemsPerPage,
}: any) {
  const renderPagination = (total: number) => (
    <div className="flex justify-between items-center p-4 border-t bg-muted/10">
      <span className="text-xs font-medium text-muted-foreground">
        Mostrando {(page - 1) * itemsPerPage + 1} a {Math.min(page * itemsPerPage, total)} de{' '}
        {total}
      </span>
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPage((p: number) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPage((p: number) => p + 1)}
          disabled={page * itemsPerPage >= total}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  if (activeTab === 'financeiro') {
    return (
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedTxs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
              {pagedTxs.map((t: Transaction) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{t.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.status}</Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-bold text-sm',
                      t.type === 'Receita' ? 'text-primary' : 'text-destructive',
                    )}
                  >
                    {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {renderPagination(filteredTxsLength)}
      </Card>
    )
  }

  if (activeTab === 'propostas') {
    return (
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Criação</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedProps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
              {pagedProps.map((p: Proposal) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{p.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {deals.find((d: Deal) => d.id === p.leadId)?.title || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm text-primary">
                    {formatCurrency(p.value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {renderPagination(filteredPropsLength)}
      </Card>
    )
  }

  if (activeTab === 'agenda') {
    return (
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSlots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
              {pagedSlots.map((t: TimeSlot) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs font-medium">
                    {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {t.time}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.isBooked ? (
                      t.menteeName
                    ) : (
                      <span className="italic text-muted-foreground">Livre</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.isBooked ? 'default' : 'outline'}>
                      {t.isBooked ? 'Reservado' : 'Disponível'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {renderPagination(filteredSlotsLength)}
      </Card>
    )
  }

  return null
}
