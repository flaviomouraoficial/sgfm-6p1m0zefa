import { useState, useMemo, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { cloudApi } from '@/lib/cloudApi'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Search, Calendar as CalIcon, Filter } from 'lucide-react'

export default function Relatorios() {
  const { transactions, timeSlots, proposals } = useMainStore()
  const [deals, setDeals] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    cloudApi.deals.list().then(setDeals)
  }, [])

  // Financeiro Filter
  const filteredTxs = useMemo(
    () =>
      transactions
        .filter((t) => {
          if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
          if (start && t.date < start) return false
          if (end && t.date > end) return false
          return true
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, search, start, end],
  )
  const pagedTxs = filteredTxs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Agenda Filter
  const filteredSlots = useMemo(
    () =>
      timeSlots
        .filter((t) => {
          if (search && !t.menteeName?.toLowerCase().includes(search.toLowerCase())) return false
          if (start && t.date < start) return false
          if (end && t.date > end) return false
          return true
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [timeSlots, search, start, end],
  )
  const pagedSlots = filteredSlots.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Propostas Filter
  const filteredProps = useMemo(
    () =>
      proposals
        .filter((p) => {
          if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
          if (start && p.expirationDate < start) return false
          if (end && p.expirationDate > end) return false
          return true
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [proposals, search, start, end],
  )
  const pagedProps = filteredProps.slice((page - 1) * itemsPerPage, page * itemsPerPage)

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
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPage((p) => p + 1)}
          disabled={page * itemsPerPage >= total}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-accent">Relatórios Avançados</h1>
        <p className="text-muted-foreground mt-1">Extração de dados com filtros personalizados.</p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 bg-white shadow-sm items-end md:items-center">
        <div className="space-y-1.5 w-full md:w-auto">
          <label className="text-xs font-semibold text-muted-foreground flex items-center">
            <CalIcon className="w-3 h-3 mr-1" /> Data Inicial
          </label>
          <Input
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              setPage(1)
            }}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5 w-full md:w-auto">
          <label className="text-xs font-semibold text-muted-foreground flex items-center">
            <CalIcon className="w-3 h-3 mr-1" /> Data Final
          </label>
          <Input
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value)
              setPage(1)
            }}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5 flex-1 w-full">
          <label className="text-xs font-semibold text-muted-foreground flex items-center">
            <Search className="w-3 h-3 mr-1" /> Termo de Busca
          </label>
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="h-9 text-sm"
          />
        </div>
        <Button
          variant="secondary"
          className="h-9 shrink-0 px-6"
          onClick={() => {
            setSearch('')
            setStart('')
            setEnd('')
            setPage(1)
          }}
        >
          Limpar
        </Button>
      </Card>

      <Tabs defaultValue="financeiro" className="w-full" onValueChange={() => setPage(1)}>
        <TabsList className="mb-4">
          <TabsTrigger value="financeiro">Transações Financeiras</TabsTrigger>
          <TabsTrigger value="propostas">Propostas Comerciais</TabsTrigger>
          <TabsTrigger value="agenda">Agenda e Sessões</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro">
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
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {pagedTxs.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/10">
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{t.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {t.status}
                        </Badge>
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
            {renderPagination(filteredTxs.length)}
          </Card>
        </TabsContent>

        <TabsContent value="propostas">
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Criação</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Lead Vinculado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedProps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {pagedProps.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/10">
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{p.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {deals.find((d) => d.id === p.leadId)?.title || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] bg-background">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-primary">
                        {formatCurrency(p.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {renderPagination(filteredProps.length)}
          </Card>
        </TabsContent>

        <TabsContent value="agenda">
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Mentorado / Cliente</TableHead>
                    <TableHead>Status Reserva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedSlots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {pagedSlots.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/10">
                      <TableCell className="text-xs whitespace-nowrap font-medium">
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {t.time}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.isBooked ? (
                          t.menteeName
                        ) : (
                          <span className="text-muted-foreground italic">Horário Livre</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.isBooked ? 'default' : 'outline'} className="text-[10px]">
                          {t.isBooked ? 'Reservado' : 'Disponível'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {renderPagination(filteredSlots.length)}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
