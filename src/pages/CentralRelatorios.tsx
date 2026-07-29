import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, FileText, PieChart, BookOpen, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

export default function CentralRelatorios() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('disc')
  const [discResults, setDiscResults] = useState<any[]>([])
  const [saasResults, setSaasResults] = useState<any[]>([])
  const [protensoraCerts, setProtensoraCerts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [disc, saas, certs, allUsers] = await Promise.all([
        pb
          .collection('v1_disc_respostas')
          .getFullList({ expand: 'link_id,link_id.empresa_id,result_id', sort: '-created' })
          .catch(() => []),
        pb
          .collection('v1_saas_results')
          .getFullList({ expand: 'client,diagnostic', sort: '-created' })
          .catch(() => []),
        pb
          .collection('v1_protensora_certificados')
          .getFullList({ expand: 'user_id,trilha_id', sort: '-created' })
          .catch(() => []),
        pb
          .collection('users')
          .getFullList({ sort: 'name' })
          .catch(() => []),
      ])
      setDiscResults(disc)
      setSaasResults(saas)
      setProtensoraCerts(certs)
      setUsers(allUsers)
    } finally {
      setLoading(false)
    }
  }

  const filterByUser = (records: any[], userField: string) => {
    if (selectedUser === 'all') return records
    return records.filter((r) => {
      const uid = r[userField] || r.expand?.[userField]?.id
      return uid === selectedUser
    })
  }

  const getNivelBadge = (nivel: string) => {
    const colors: Record<string, string> = {
      essencial: 'border-blue-400 text-blue-600',
      intermediario: 'border-purple-400 text-purple-600',
      completo: 'border-green-500 text-green-600',
    }
    return (
      <Badge variant="outline" className={colors[nivel] || ''}>
        {nivel}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" /> Central de Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize todos os relatórios e resultados em um único lugar.
          </p>
        </div>
        <div className="w-full sm:w-[280px]">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="disc">
            <Target className="w-4 h-4 mr-2" /> DISC
          </TabsTrigger>
          <TabsTrigger value="pilares">
            <PieChart className="w-4 h-4 mr-2" /> 9 Pilares
          </TabsTrigger>
          <TabsTrigger value="360">
            <PieChart className="w-4 h-4 mr-2" /> 360°
          </TabsTrigger>
          <TabsTrigger value="protensora">
            <BookOpen className="w-4 h-4 mr-2" /> Protensora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disc">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" /> Perfil Comportamental (DISC)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filterByUser(discResults, 'email').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum resultado DISC encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterByUser(discResults, 'email').map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell>{r.expand?.link_id?.expand?.empresa_id?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.perfil_predominante}</Badge>
                        </TableCell>
                        <TableCell>{getNivelBadge(r.nivel_relatorio || 'essencial')}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(r.created), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/disc/report/${r.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pilares">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" /> Assessment 9 Pilares
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filterByUser(
                      saasResults.filter((r) => r.type !== 'strategic_360'),
                      'client',
                    ).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterByUser(
                      saasResults.filter((r) => r.type !== 'strategic_360'),
                      'client',
                    ).map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {r.expand?.client?.name || r.expand?.client?.email || '-'}
                        </TableCell>
                        <TableCell>{r.expand?.diagnostic?.title || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'Concluído' ? 'default' : 'outline'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{getNivelBadge(r.nivel_relatorio || 'essencial')}</TableCell>
                        <TableCell className="text-sm">
                          {r.completed_at
                            ? format(new Date(r.completed_at), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="360">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" /> Avaliação 360°
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filterByUser(
                      saasResults.filter((r) => r.type === 'strategic_360'),
                      'client',
                    ).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum resultado 360° encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterByUser(
                      saasResults.filter((r) => r.type === 'strategic_360'),
                      'client',
                    ).map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {r.expand?.client?.name || r.expand?.client?.email || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'Concluído' ? 'default' : 'outline'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{getNivelBadge(r.nivel_relatorio || 'essencial')}</TableCell>
                        <TableCell className="text-sm">
                          {r.completed_at
                            ? format(new Date(r.completed_at), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protensora">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Protensora - Certificados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Trilha</TableHead>
                    <TableHead>Pontuação</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filterByUser(protensoraCerts, 'user_id').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum certificado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterByUser(protensoraCerts, 'user_id').map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {r.expand?.user_id?.name || r.expand?.user_id?.email || '-'}
                        </TableCell>
                        <TableCell>{r.expand?.trilha_id?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.final_score}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.codigo_verificacao}</TableCell>
                        <TableCell className="text-sm">
                          {r.issue_date
                            ? format(new Date(r.issue_date), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
