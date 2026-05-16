import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type FilterState = {
  categoria: string
  status: string
  favorito: string
  temCapa: string
}

interface Props {
  search: string
  setSearch: (s: string) => void
  filters: FilterState
  setFilters: (f: FilterState) => void
  sort: string
  setSort: (s: string) => void
}

export function BookFilters({ search, setSearch, filters, setFilters, sort, setSort }: Props) {
  return (
    <div className="flex flex-col gap-4 mb-6 bg-card p-4 rounded-lg border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Buscar título, autor, assunto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background"
        />
        <Select
          value={filters.categoria}
          onValueChange={(v) => setFilters({ ...filters, categoria: v })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas Categorias</SelectItem>
            <SelectItem value="Ficção">Ficção</SelectItem>
            <SelectItem value="Biografia">Biografia</SelectItem>
            <SelectItem value="Autodesenvolvimento">Autodesenvolvimento</SelectItem>
            <SelectItem value="Técnico">Técnico</SelectItem>
            <SelectItem value="Outras">Outras</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos Status</SelectItem>
            <SelectItem value="Não lido">Não lido</SelectItem>
            <SelectItem value="Lendo">Lendo</SelectItem>
            <SelectItem value="Lido">Lido</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.favorito}
          onValueChange={(v) => setFilters({ ...filters, favorito: v })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Favoritos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Sim">Apenas Favoritos</SelectItem>
            <SelectItem value="Não">Não Favoritos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          value={filters.temCapa}
          onValueChange={(v) => setFilters({ ...filters, temCapa: v })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Tem Capa?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Sim">Com Capa</SelectItem>
            <SelectItem value="Não">Sem Capa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="antigos">Mais antigos</SelectItem>
            <SelectItem value="titulo-az">Título (A-Z)</SelectItem>
            <SelectItem value="titulo-za">Título (Z-A)</SelectItem>
            <SelectItem value="autor">Autor</SelectItem>
            <SelectItem value="favoritos">Favoritos primeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
