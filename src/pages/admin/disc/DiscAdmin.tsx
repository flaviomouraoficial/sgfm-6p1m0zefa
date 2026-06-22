import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()

    let targetEmpresaId = formData.empresa_id

    if (!targetEmpresaId && !newEmpresaNome.trim()) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma empresa existente ou digite o nome de uma nova.',
        variant: 'destructive',
      })
      return
    }

    const permitidos = parseInt(formData.usos_permitidos)
    if (isNaN(permitidos) || formData.usos_permitidos.toString().trim() === '') {
      toast({
        title: 'Atenção',
        description: 'O limite de usos deve ser um número válido.',
        variant: 'destructive',
      })
      return
    }

    try {
      if (newEmpresaNome.trim()) {
        const existing = empresas.find(
          (emp) => emp.name.toLowerCase() === newEmpresaNome.trim().toLowerCase(),
        )
        if (existing) {
          targetEmpresaId = existing.id
        } else {
          const emp = await pb
            .collection('v1_disc_empresas')
            .create({ name: newEmpresaNome.trim() })
          setEmpresas((prev) => [...prev, emp])
          targetEmpresaId = emp.id
        }
      }

      const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

      await pb.collection('v1_disc_links').create({
        empresa_id: targetEmpresaId,
        usos_permitidos: permitidos,
        usos_realizados: 0,
        ativo: true,
        token,
      })

      setCreateOpen(false)
      setFormData({ empresa_id: '', usos_permitidos: '10' })
      setNewEmpresaNome('')
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
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Assessment DISC</h1>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/disc/results')}>
              <Users className="w-4 h-4 mr-2" /> Resultados
            </Button>
          </div>
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
            <form onSubmit={handleCreateLink} className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Empresa Existente</Label>
                  <Select
                    value={formData.empresa_id}
                    onValueChange={(v) => {
                      setFormData({ ...formData, empresa_id: v })
                      setNewEmpresaNome('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa..." />
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou crie uma nova
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nova Empresa</Label>
                  <Input
                    placeholder="Nome da nova empresa..."
                    value={newEmpresaNome}
                    onChange={(e) => {
                      setNewEmpresaNome(e.target.value)
                      setFormData({ ...formData, empresa_id: '' })
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Limite de Usos (Ex: 1, 10, 999 ou -1 para Ilimitado)</Label>
                <Input
                  type="number"
                  value={formData.usos_permitidos}
                  onChange={(e) => setFormData({ ...formData, usos_permitidos: e.target.value })}
                  placeholder="Ex: 10"
                />
              </div>

              <Button type="submit" className="w-full mt-4">
                Gerar Link
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col h-[calc(100vh-12rem)] min-h-[400px] lg:col-span-1">
          <CardHeader className="shrink-0">
            <CardTitle>Links Ativos</CardTitle>
            <CardDescription>Links gerados para as empresas.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
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

        <Card className="flex flex-col h-[calc(100vh-12rem)] min-h-[400px] lg:col-span-2">
          <CardHeader className="shrink-0">
            <CardTitle>Relatórios Gerados</CardTitle>
            <CardDescription>Resultados recentes dos assessments.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Nome</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Perfil</TableHead>
                  <TableHead className="whitespace-nowrap">Data</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>{' '}
              <TableBody>
                {respostas.map((resp) => (
                  <TableRow key={resp.id}>
                    <TableCell className="font-medium whitespace-nowrap">{resp.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {resp.email}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary">
                        {resp.perfil_predominante}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                      {new Date(resp.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/disc/report/${resp.id}`, '_blank')}
                      >
                        Baixar PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {respostas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
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
