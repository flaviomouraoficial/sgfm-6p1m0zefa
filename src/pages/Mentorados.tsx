import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Users, Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function Mentorados() {
  const [mentees, setMentees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchMentees = async () => {
    try {
      setLoading(true)
      setError(null)
      const records = await pb.collection('v1_mentees').getFullList({
        sort: '-created',
      })
      setMentees(records)
    } catch (err: any) {
      console.error('Error fetching mentees:', err)
      setError(err.message || 'Falha ao buscar os mentorados.')
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
    (mentee) =>
      mentee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentee.company?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">Erro de Carregamento</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={fetchMentees} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Mentorados
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os mentorados, status e valores de contrato.
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Mentorado
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Lista de Mentorados</CardTitle>
              <CardDescription>
                {filteredMentees.length}{' '}
                {filteredMentees.length === 1 ? 'mentorado encontrado' : 'mentorados encontrados'}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar mentorados..."
                className="pl-9 bg-background w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && mentees.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium">
                Buscando informações dos mentorados...
              </p>
            </div>
          ) : filteredMentees.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                Nenhum mentorado encontrado
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Tente ajustar os termos da sua busca ou adicione um novo mentorado à sua base de
                dados.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto bg-background">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Nome</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Empresa</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Valor do Contrato</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMentees.map((mentee) => (
                    <TableRow key={mentee.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{mentee.name}</TableCell>
                      <TableCell className="text-muted-foreground">{mentee.email || '-'}</TableCell>
                      <TableCell>{mentee.company || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mentee.status?.toLowerCase() === 'ativo' ? 'default' : 'secondary'
                          }
                          className={
                            mentee.status?.toLowerCase() === 'ativo'
                              ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200'
                              : ''
                          }
                        >
                          {mentee.status || 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {mentee.contractValue
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(mentee.contractValue)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
