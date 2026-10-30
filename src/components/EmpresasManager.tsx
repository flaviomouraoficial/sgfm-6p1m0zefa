import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Building2, Plus, Pencil, Trash2, CheckCircle2, Users, AlertTriangle } from 'lucide-react'
import { empresasService } from '@/services/empresas'
import { representantesService } from '@/services/representantes'
import { RepresentantesDialog } from '@/components/representantes/RepresentantesDialog'
import { Empresa, RepresentanteLegal } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useMainStore } from '@/stores/main'

export function EmpresasManager() {
  const { toast } = useToast()
  const { fetchEmpresas, setSelectedEmpresaId } = useMainStore()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState<Partial<Empresa> | null>(null)
  const [saving, setSaving] = useState(false)

  // Representantes state
  const [repDialogOpen, setRepDialogOpen] = useState(false)
  const [selectedRepEmpresa, setSelectedRepEmpresa] = useState<Empresa | null>(null)
  const [principaisMap, setPrincipaisMap] = useState<Record<string, RepresentanteLegal | null>>({})

  const loadEmpresas = async () => {
    try {
      setLoading(true)
      const list = await empresasService.list()
      setEmpresas(list)

      // Carregar representante principal de cada uma
      const pMap: Record<string, RepresentanteLegal | null> = {}
      for (const emp of list) {
        pMap[emp.id] = await representantesService.getPrincipalByEmpresa(emp.id)
      }
      setPrincipaisMap(pMap)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as empresas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmpresas()
  }, [])

  const handleOpenCreate = () => {
    setEditingEmpresa({
      nome: '',
      razao_social: '',
      cnpj: '',
      inscricao_estadual: '',
      email: '',
      email_notificacoes: '',
      telefone: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      is_principal: false,
      cor_identificacao: '#1e3a8a',
    })
    setDialogOpen(true)
  }

  const handleOpenRepresentantes = (empresa: Empresa) => {
    setSelectedRepEmpresa(empresa)
    setRepDialogOpen(true)
  }

  const handleOpenEdit = (empresa: Empresa) => {
    setEditingEmpresa({ ...empresa })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingEmpresa?.nome || !editingEmpresa?.cnpj) {
      toast({
        title: 'Atenção',
        description: 'Nome e CNPJ são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      if (editingEmpresa.id) {
        await empresasService.update(editingEmpresa.id, editingEmpresa)
        toast({ title: 'Sucesso', description: 'Empresa atualizada com sucesso!' })
      } else {
        await empresasService.create(editingEmpresa)
        toast({ title: 'Sucesso', description: 'Empresa cadastrada com sucesso!' })
      }
      setDialogOpen(false)
      await loadEmpresas()
      await fetchEmpresas()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha ao salvar dados da empresa.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      try {
        await empresasService.delete(id)
        toast({ title: 'Excluída', description: 'Empresa removida com sucesso.' })
        await loadEmpresas()
        await fetchEmpresas()
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir a empresa.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleSetPrincipal = async (empresa: Empresa) => {
    try {
      // Remover principal de todas e colocar nesta
      for (const emp of empresas) {
        if (emp.id === empresa.id) {
          await empresasService.update(emp.id, { is_principal: true })
        } else if (emp.is_principal) {
          await empresasService.update(emp.id, { is_principal: false })
        }
      }
      toast({ title: 'Atualizado', description: `${empresa.nome} agora é a empresa principal.` })
      await loadEmpresas()
      await fetchEmpresas()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao alterar empresa principal.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="shadow-sm border-l-4 border-l-blue-600">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <CardTitle>Gestão Multi-CNPJ (Empresas)</CardTitle>
            </div>
            <CardDescription>
              Cadastre suas duas empresas (CNPJs de gestão e consultoria). Lançamentos, estoques,
              mentorandos e relatórios são filtrados pela empresa selecionada.
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Empresa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Carregando empresas...</p>
        ) : empresas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma empresa cadastrada.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {empresas.map((emp) => (
              <div
                key={emp.id}
                className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 w-1.5 h-full"
                  style={{ backgroundColor: emp.cor_identificacao || '#288f87' }}
                />
                <div className="pl-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      {emp.nome}
                      {emp.is_principal && (
                        <Badge
                          variant="default"
                          className="text-[10px] bg-primary text-primary-foreground"
                        >
                          Principal / Matriz
                        </Badge>
                      )}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(emp)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {!emp.is_principal && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(emp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {emp.razao_social && (
                    <p className="text-xs text-muted-foreground truncate">{emp.razao_social}</p>
                  )}
                  <p className="text-xs font-mono text-primary font-semibold mt-1">
                    CNPJ: {emp.cnpj}
                  </p>
                  {emp.email && (
                    <p className="text-xs text-muted-foreground mt-0.5">E-mail: {emp.email}</p>
                  )}
                  {emp.telefone && (
                    <p className="text-xs text-muted-foreground mt-0.5">Telefone: {emp.telefone}</p>
                  )}
                  {emp.cidade && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cidade: {emp.cidade} - {emp.estado}
                      {emp.logradouro ? ` | ${emp.logradouro}, ${emp.numero || 's/n'}` : ''}
                    </p>
                  )}

                  {/* Alerta de representante ou status */}
                  <div className="mt-2 pt-2 border-t border-border/40">
                    {principaisMap[emp.id] ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          Rep. Principal:{' '}
                          <strong className="text-foreground">
                            {principaisMap[emp.id]?.nome_completo}
                          </strong>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] px-2 text-primary"
                          onClick={() => handleOpenRepresentantes(emp)}
                        >
                          Gerenciar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-700 text-xs">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          Sem representante legal vinculado!
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] px-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-800"
                          onClick={() => handleOpenRepresentantes(emp)}
                        >
                          Cadastrar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 pl-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setSelectedEmpresaId(emp.id)
                      toast({
                        title: 'Empresa Ativada',
                        description: `Visualizando dados de ${emp.nome}`,
                      })
                    }}
                  >
                    Filtrar por esta empresa
                  </Button>
                  {!emp.is_principal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground hover:text-primary gap-1"
                      onClick={() => handleSetPrincipal(emp)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Definir Principal
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog de Cadastro/Edição de Empresa */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEmpresa?.id ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nome Fantasia *</Label>
                  <Input
                    value={editingEmpresa?.nome || ''}
                    onChange={(e) => setEditingEmpresa({ ...editingEmpresa, nome: e.target.value })}
                    placeholder="Ex: Trend Consultoria"
                  />
                </div>
                <div className="space-y-1">
                  <Label>CNPJ *</Label>
                  <Input
                    value={editingEmpresa?.cnpj || ''}
                    onChange={(e) => setEditingEmpresa({ ...editingEmpresa, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Razão Social</Label>
                <Input
                  value={editingEmpresa?.razao_social || ''}
                  onChange={(e) =>
                    setEditingEmpresa({ ...editingEmpresa, razao_social: e.target.value })
                  }
                  placeholder="Razão Social completa"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>E-mail Geral</Label>
                  <Input
                    type="email"
                    value={editingEmpresa?.email || ''}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, email: e.target.value })
                    }
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label>E-mail p/ Notificações Contratuais *</Label>
                  <Input
                    type="email"
                    value={editingEmpresa?.email_notificacoes || ''}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, email_notificacoes: e.target.value })
                    }
                    placeholder="notificacoes@empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    value={editingEmpresa?.telefone || ''}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, telefone: e.target.value })
                    }
                    placeholder="(43) 99999-9999"
                  />
                </div>
                <div className="space-y-1">
                  <Label>CEP</Label>
                  <Input
                    value={editingEmpresa?.cep || ''}
                    onChange={(e) => setEditingEmpresa({ ...editingEmpresa, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Logradouro (Rua/Av.)</Label>
                  <Input
                    value={editingEmpresa?.logradouro || ''}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, logradouro: e.target.value })
                    }
                    placeholder="Rua Exemplo"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Número</Label>
                  <Input
                    value={editingEmpresa?.numero || ''}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, numero: e.target.value })
                    }
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Complemento</Label>
                  <Input
                    value={editingEmpresa?.complemento || ''}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, complemento: e.target.value })
                    }
                    placeholder="Sala 1"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input
                    value={editingEmpresa?.bairro || ''}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, bairro: e.target.value })
                    }
                    placeholder="Centro"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Cidade / UF</Label>
                  <div className="grid grid-cols-3 gap-1">
                    <Input
                      className="col-span-2"
                      value={editingEmpresa?.cidade || ''}
                      onChange={(e) =>
                        setEditingEmpresa({ ...editingEmpresa, cidade: e.target.value })
                      }
                      placeholder="Cidade"
                    />
                    <Input
                      value={editingEmpresa?.estado || ''}
                      onChange={(e) =>
                        setEditingEmpresa({ ...editingEmpresa, estado: e.target.value })
                      }
                      placeholder="UF"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1">
                  <Label>Cor de Identificação</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 h-9 p-1 cursor-pointer shrink-0"
                      value={editingEmpresa?.cor_identificacao || '#288f87'}
                      onChange={(e) =>
                        setEditingEmpresa({ ...editingEmpresa, cor_identificacao: e.target.value })
                      }
                    />
                    <Input
                      type="text"
                      className="font-mono text-xs uppercase"
                      value={editingEmpresa?.cor_identificacao || '#288f87'}
                      onChange={(e) =>
                        setEditingEmpresa({ ...editingEmpresa, cor_identificacao: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_principal"
                    checked={editingEmpresa?.is_principal || false}
                    onChange={(e) =>
                      setEditingEmpresa({ ...editingEmpresa, is_principal: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-primary"
                  />
                  <Label htmlFor="is_principal" className="text-xs cursor-pointer font-medium">
                    Empresa Principal / Matriz
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Empresa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Representantes Legais */}
        {selectedRepEmpresa && (
          <RepresentantesDialog
            open={repDialogOpen}
            onOpenChange={setRepDialogOpen}
            empresaId={selectedRepEmpresa.id}
            entityName={selectedRepEmpresa.nome}
            onChanged={loadEmpresas}
          />
        )}
      </CardContent>
    </Card>
  )
}
