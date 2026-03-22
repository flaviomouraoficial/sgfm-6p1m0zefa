import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar as CalIcon, Search, Filter } from 'lucide-react'

export function ReportFilters({
  start,
  setStart,
  end,
  setEnd,
  status,
  setStatus,
  search,
  setSearch,
}: any) {
  return (
    <Card className="p-4 flex flex-col md:flex-row gap-4 bg-white shadow-sm items-end md:items-center">
      <div className="space-y-1.5 w-full md:w-auto">
        <label className="text-xs font-semibold text-muted-foreground flex items-center">
          <CalIcon className="w-3 h-3 mr-1" /> Data Inicial
        </label>
        <Input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
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
          onChange={(e) => setEnd(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1.5 w-full md:w-auto">
        <label className="text-xs font-semibold text-muted-foreground flex items-center">
          <Filter className="w-3 h-3 mr-1" /> Status Financeiro
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 text-sm w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Pago">Pago / Recebido</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 flex-1 w-full">
        <label className="text-xs font-semibold text-muted-foreground flex items-center">
          <Search className="w-3 h-3 mr-1" /> Busca Livre
        </label>
        <Input
          placeholder="Buscar por descrição ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <Button
        variant="secondary"
        className="h-9 shrink-0 px-6 w-full md:w-auto"
        onClick={() => {
          setSearch('')
          setStart('')
          setEnd('')
          setStatus('Todos')
        }}
      >
        Limpar Filtros
      </Button>
    </Card>
  )
}
