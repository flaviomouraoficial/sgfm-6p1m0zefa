import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Copy, Plus, Trash2 } from 'lucide-react'

export default function SaasLinks() {
  const [links, setLinks] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  const [selectedDiag, setSelectedDiag] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const [newClientId, setNewClientId] = useState<string>('')
  const [newDiagId, setNewDiagId] = useState<string>('')
  const [newLinkType, setNewLinkType] = useState<string>('padrao')
  const [newQuota, setNewQuota] = useState<number>(1)

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const diags = await pb.collection('v1_saas_diagnostics').getFullList({ sort: 'title' })
      setDiagnostics(diags)

      const clis = await pb.collection('v1_clientes').getFullList({ sort: 'name' })
      setClients(clis)

      fetchLinks('all', 'all')
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLinks = async (diagId: string, linkType: string) => {
    try {
      let filter = ''
      const filters = []
      if (diagId !== 'all') filters.push(`diagnostic_id="${diagId}"`)
      if (linkType !== 'all') filters.push(`link_type="${linkType}"`)

      if (filters.length > 0) filter = filters.join(' && ')

      const res = await pb.collection('v1_assessment_links').getFullList({
        filter,
        expand: 'diagnostic_id,cliente_id',
        sort: '-created',
      })
      setLinks(res)
    } catch (err) {
      console.error(err)
    }
  }

  const handleFilterChange = (type: 'diag' | 'linkType', val: string) => {
    if (type === 'diag') {
      setSelectedDiag(val)
      fetchLinks(val, selectedType)
    } else {
      setSelectedType(val)
      fetchLinks(selectedDiag, val)
    }
  }

  const handleCreateLink = async () => {
    if (!newClientId || !newDiagId) {
      toast({
        title: 'Atenção',
        description: 'Selecione o cliente e o diagnóstico.',
        variant: 'destructive',
      })
      return
    }

    try {
      const link_unico = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
      await pb.collection('v1_assessment_links').create({
        cliente_id: newClientId,
        diagnostic_id: newDiagId,
        link_type: newLinkType,
        quantidade_permitida: newQuota,
        quantidade_usada: 0,
        status: 'ativo',
        link_unico,
        criado_por: pb.authStore.record?.id,
      })
      toast({ title: 'Link gerado com sucesso!' })
      fetchLinks(selectedDiag, selectedType)

      setNewClientId('')
      setNewDiagId('')
      setNewLinkType('padrao')
      setNewQuota(1)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const copyToClipboard = (url: string) => {
    const fullUrl = `${window.location.origin}/assessment/${url}`
    navigator.clipboard.writeText(fullUrl)
    toast({ title: 'Link copiado!' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este link?')) return
    try {
      await pb.collection('v1_assessment_links').delete(id)
      toast({ title: 'Link removido com sucesso' })
      fetchLinks(selectedDiag, selectedType)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">Gestão de Links</h2>
        <p className="text-muted-foreground">
          Crie e gerencie links externos de avaliação para os clientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerar Novo Link</CardTitle>
          <CardDescription>
            Crie um link de acesso direto para que terceiros respondam ao diagnóstico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Cliente (CRM)</label>
              <Select value={newClientId} onValueChange={setNewClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Diagnóstico</label>
              <Select value={newDiagId} onValueChange={setNewDiagId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {diagnostics.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-36">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={newLinkType} onValueChange={setNewLinkType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="padrao">Padrão</SelectItem>
                  <SelectItem value="estrategico">Estratégico</SelectItem>
                  <SelectItem value="tatico">Tático</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-24">
              <label className="text-sm font-medium">Limite</label>
              <Input
                type="number"
                value={newQuota}
                onChange={(e) => setNewQuota(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>

            <Button onClick={handleCreateLink} className="bg-[#1e3a8a] text-white">
              <Plus className="h-4 w-4 mr-2" /> Gerar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="space-y-1">
            <CardTitle>Links Gerados</CardTitle>
            <CardDescription>Acompanhe os links e suas utilizações.</CardDescription>
          </div>
          <div className="flex gap-4">
            <Select value={selectedDiag} onValueChange={(val) => handleFilterChange('diag', val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por Diagnóstico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Diagnósticos</SelectItem>
                {diagnostics.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedType}
              onValueChange={(val) => handleFilterChange('linkType', val)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="padrao">Padrão</SelectItem>
                <SelectItem value="estrategico">Estratégico</SelectItem>
                <SelectItem value="tatico">Tático</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Respostas / Limite</TableHead>
                <TableHead>Link Único</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum link encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.expand?.diagnostic_id?.title}
                    </TableCell>
                    <TableCell>{link.expand?.cliente_id?.name}</TableCell>
                    <TableCell className="capitalize">{link.link_type}</TableCell>
                    <TableCell className="text-center">
                      {link.quantidade_usada} / {link.quantidade_permitida}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <code className="text-xs truncate bg-muted px-2 py-1 rounded">
                          {link.link_unico}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(link.link_unico)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
