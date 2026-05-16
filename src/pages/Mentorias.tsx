import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Briefcase,
  Phone,
  Users,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Mentee } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Mentorias() {
  const [mentees, setMentees] = useState<Mentee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [search, setSearch] = useState('')

  const fetchMentees = async () => {
    try {
      setError(null)
      const records = await pb.collection('v1_mentees').getFullList<Mentee>({
        sort: '-created',
      })
      setMentees(records)
    } catch (err: any) {
      console.error('Error fetching mentees:', err)
      setError(err instanceof Error ? err : new Error('Falha ao carregar mentorados'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMentees()
  }, [])

  useRealtime('v1_mentees', () => {
    fetchMentees()
  })

  const filteredMentees = mentees.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.company?.toLowerCase().includes(search.toLowerCase()),
  )

  if (error) {
    // Throw to ErrorBoundary to prevent white screens and show the fallback UI
    throw error
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Mentorados
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus mentorados e acompanhe o progresso.
          </p>
        </div>
        <Button className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Novo Mentorado
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2 bg-muted/50 rounded-md p-1 border border-border/50 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground ml-2" />
            <Input
              placeholder="Buscar por nome, email ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-2 h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : filteredMentees.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Nenhum mentorado encontrado</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                {search
                  ? 'Não encontramos resultados para a sua busca.'
                  : 'Você ainda não possui mentorados cadastrados no sistema.'}
              </p>
              {search && (
                <Button variant="link" onClick={() => setSearch('')} className="mt-2">
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Contato</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Empresa</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMentees.map((mentee) => (
                    <TableRow key={mentee.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{mentee.name}</span>
                          <span className="text-xs text-muted-foreground md:hidden mt-0.5">
                            {mentee.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          {mentee.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]" title={mentee.email}>
                                {mentee.email}
                              </span>
                            </div>
                          )}
                          {mentee.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span>{mentee.phone}</span>
                            </div>
                          )}
                          {!mentee.email && !mentee.phone && <span>-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {mentee.company ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{mentee.company}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {mentee.status || 'Ativo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
        </CardContent>
      </Card>
    </div>
  )
}
