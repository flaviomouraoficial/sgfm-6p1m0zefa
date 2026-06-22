import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Copy, Plus, XCircle, Users } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

export default function DiscAdmin() {
  const { toast } = useToast()

  const [empresas, setEmpresas] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [respostas, setRespostas] = useState<any[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ empresa_id: '', usos_permitidos: '10' })
  const [newEmpresaNome, setNewEmpresaNome] = useState('')

  const loadData = async () => {
    try {
      const emps = await pb.collection('v1_disc_empresas').getFullList()
      setEmpresas(emps)
      const lks = await pb
        .collection('v1_disc_links')
        .getFullList({ expand: 'empresa_id', sort: '-created' })
      setLinks(lks)
      const resps = await pb
        .collection('v1_disc_respostas')
        .getFullList({ expand: 'link_id', sort: '-created' })
      setRespostas(resps)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime(
    'v1_disc_links',
    () => {
      loadData()
    },
    true,
  )
  useRealtime(
    'v1_disc_respostas',
    () => {
      loadData()
    },
    true,
  )

  const handleCreateEmpresa = async () => {
    if (!newEmpresaNome) return
    try {
      const emp = await pb.collection('v1_disc_empresas').create({ name: newEmpresaNome })
      setEmpresas((prev) => [...prev, emp])
      setFormData({ ...formData, empresa_id: emp.id })
      setNewEmpresaNome('')
      toast({ title: 'Empresa criada com sucesso' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleCreateLink = async () => {
    if (!formData.empresa_id) return
    const permitidos = parseInt(formData.usos_permitidos)
    if (isNaN(permitidos)) return

    const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

    try {
      await pb.collection('v1_disc_links').create({
        empresa_id: formData.empresa_id,
        usos_permitidos: permitidos,
        usos_realizados: 0,
        ativo: true,
        token,
      })
      setCreateOpen(false)
      setFormData({ empresa_id: '', usos_permitidos: '10' })
      toast({ title: 'Link gerado com sucesso!' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const toggleLinkStatus = async (id: string, currentStatus: boolean) => {
    try {
      await pb.collection('v1_disc_links').update(id, { ativo: !currentStatus })
      toast({ title: currentStatus ? 'Link desativado' : 'Link reativado' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/disc/${token}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link copiado!' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment DISC</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie links e resultados da avaliação comportamental.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Novo Link DISC
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Novo Link DISC</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>1. Selecione ou crie a empresa</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova empresa..."
                    value={newEmpresaNome}
                    onChange={(e) => setNewEmpresaNome(e.target.value)}
                  />
                  <Button variant="secondary" onClick={handleCreateEmpresa} type="button">
                    Criar
                  </Button>
                </div>
                <Select
                  value={formData.empresa_id}
                  onValueChange={(v) => setFormData({ ...formData, empresa_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ou selecione uma existente" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>2. Limite de Usos (Ex: 1, 10, 999 ou -1 para Ilimitado)</Label>
                <Input
                  type="number"
                  value={formData.usos_permitidos}
                  onChange={(e) => setFormData({ ...formData, usos_permitidos: e.target.value })}
                  placeholder="Ex: 10"
                />
              </div>

              <Button type="button" className="w-full mt-4" onClick={handleCreateLink}>
                Gerar Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Links Ativos</CardTitle>
            <CardDescription>Links gerados para as empresas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.expand?.empresa_id?.name || 'Desconhecida'}
                    </TableCell>
                    <TableCell>
                      {link.usos_realizados} /{' '}
                      {link.usos_permitidos === -1 ? '∞' : link.usos_permitidos}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${link.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {link.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(link.token)}
                        title="Copiar URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLinkStatus(link.id, link.ativo)}
                        title={link.ativo ? 'Desativar' : 'Ativar'}
                      >
                        <XCircle
                          className={`w-4 h-4 ${link.ativo ? 'text-red-500' : 'text-green-500'}`}
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {links.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Nenhum link gerado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Respostas</CardTitle>
            <CardDescription>Resultados recentes dos assessments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Respondente</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {respostas.map((resp) => (
                  <TableRow key={resp.id}>
                    <TableCell>
                      <p className="font-medium">{resp.nome}</p>
                      <p className="text-xs text-muted-foreground">{resp.email}</p>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary">
                        {resp.perfil_predominante}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(resp.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
                {respostas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      Nenhuma resposta registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
