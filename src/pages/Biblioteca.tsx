import { useState, useEffect, useMemo, useCallback } from 'react'
import { BookPlus, Edit, Eye, Trash2, Star, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRealtime } from '@/hooks/use-realtime'
import { getBooks, deleteBook, getBookCoverUrl } from '@/services/biblioteca'
import type { Book } from '@/lib/types'

import { BookFormDialog } from '@/components/biblioteca/BookFormDialog'
import { BookDetailsDialog } from '@/components/biblioteca/BookDetailsDialog'
import { BookFilters, FilterState } from '@/components/biblioteca/BookFilters'

export default function Biblioteca() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recentes')
  const [filters, setFilters] = useState<FilterState>({
    categoria: 'Todas',
    status: 'Todos',
    favorito: 'Todos',
    temCapa: 'Todos',
  })

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const fetchBooks = useCallback(async () => {
    try {
      const data = await getBooks()
      setBooks(data)
    } catch (e) {
      toast.error('Erro ao carregar biblioteca')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])
  useRealtime('v1_biblioteca', () => {
    fetchBooks()
  })

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este livro?')) {
      try {
        await deleteBook(id)
        toast.success('Livro excluído com sucesso!')
      } catch (e) {
        toast.error('Erro ao excluir livro')
      }
    }
  }

  const filteredBooks = useMemo(() => {
    let result = books
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.titulo.toLowerCase().includes(q) ||
          b.autor.toLowerCase().includes(q) ||
          b.categoria.toLowerCase().includes(q) ||
          (b.palavras_chave && b.palavras_chave.toLowerCase().includes(q)),
      )
    }
    if (filters.status !== 'Todos')
      result = result.filter((b) => b.status_leitura === filters.status)
    if (filters.categoria !== 'Todas')
      result = result.filter((b) => b.categoria === filters.categoria)
    if (filters.favorito !== 'Todos')
      result = result.filter((b) => b.favorito === (filters.favorito === 'Sim'))
    if (filters.temCapa !== 'Todos') {
      const reqCapa = filters.temCapa === 'Sim'
      result = result.filter((b) => Boolean(b.capa_file || b.capa_url) === reqCapa)
    }

    return [...result].sort((a, b) => {
      switch (sort) {
        case 'titulo-az':
          return a.titulo.localeCompare(b.titulo)
        case 'titulo-za':
          return b.titulo.localeCompare(a.titulo)
        case 'autor':
          return a.autor.localeCompare(b.autor)
        case 'antigos':
          return new Date(a.created).getTime() - new Date(b.created).getTime()
        case 'favoritos':
          return a.favorito === b.favorito ? 0 : a.favorito ? -1 : 1
        case 'recentes':
        default:
          return new Date(b.created).getTime() - new Date(a.created).getTime()
      }
    })
  }, [books, search, filters, sort])

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando biblioteca...
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> Biblioteca
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu acervo de livros, status de leitura e aprendizados.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedBook(null)
            setFormOpen(true)
          }}
          className="gap-2"
        >
          <BookPlus className="w-4 h-4" /> Novo Livro
        </Button>
      </div>

      <BookFilters
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
      />

      {filteredBooks.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border border-dashed">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum livro encontrado</h3>
          <p className="text-muted-foreground mt-1">
            Ajuste seus filtros ou cadastre um novo livro no acervo.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-20">Capa</TableHead>
                <TableHead>Livro</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20 text-center">Favorito</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book) => (
                <TableRow key={book.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell>
                    <img
                      src={getBookCoverUrl(book)}
                      alt={book.titulo}
                      className="w-10 h-14 object-cover rounded shadow-sm group-hover:scale-105 transition-transform"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{book.titulo}</div>
                    <div className="text-sm text-muted-foreground">{book.autor}</div>
                    {book.palavras_chave && (
                      <div className="text-xs text-primary/70 mt-0.5 truncate max-w-[250px]">
                        {book.palavras_chave}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      {book.categoria}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${book.status_leitura === 'Lido' ? 'bg-green-100 text-green-800' : book.status_leitura === 'Lendo' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}
                    >
                      {book.status_leitura}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {book.favorito ? (
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500 mx-auto" />
                    ) : (
                      <Star className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedBook(book)
                            setDetailsOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedBook(book)
                            setFormOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(book.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <BookFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        book={selectedBook}
        onSuccess={fetchBooks}
      />
      <BookDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} book={selectedBook} />
    </div>
  )
}
