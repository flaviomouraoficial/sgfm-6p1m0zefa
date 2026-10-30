import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Plus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  History,
} from 'lucide-react'
import { representantesService } from '@/services/representantes'
import { RepresentanteLegal } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface RepresentantesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaId?: string
  clienteId?: string
  entityName: string
  onChanged?: () => void
}

export function RepresentantesDialog({
  open,
  onOpenChange,
  empresaId,
  clienteId,
  entityName,
  onChanged,
}: RepresentantesDialogProps) {
  const { toast } = useToast()
  const [representantes, setRepresentantes] = useState<RepresentanteLegal[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRep, setEditingRep] = useState<RepresentanteLegal | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    nome_completo: '',
    nacionalidade: 'brasileiro(a)',
    estado_civil: 'casado(a)',
    profissao: '',
    rg: '',
    cpf: '',
    email: '',
    telefone: '',
    is_principal: true,
  })

  const loadRepresentantes = async () => {
    if (!empresaId && !clienteId) return
    try {
      setLoading(true)
      let list: RepresentanteLegal[] = []
      if (empresaId) {
        list = await representantesService.listByEmpresa(empresaId)
      } else if (clienteId) {
        list = await representantesService.listByCliente(clienteId)
      }
      setRepresentantes(list)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar representantes legais.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadRepresentantes()
    }
  }, [open, empresaId, clienteId])

  const openCreate = () => {
    setEditingRep(null)
    setFormData({
      nome_completo: '',
      nacionalidade: 'brasileiro(a)',
      estado_civil: 'casado(a)',
      profissao: '',
      rg: '',
      cpf: '',
      email: '',
      telefone: '',
      is_principal: representantes.length === 0,
    })
    setFormOpen(true)
  }

  const openEdit = (rep: RepresentanteLegal) => {
    setEditingRep(rep)
    setFormData({
      nome_completo: rep.nome_completo,
      nacionalidade: rep.nacionalidade,
      estado_civil: rep.estado_civil,
      profissao: rep.profissao,
      rg: rep.rg,
      cpf: rep.cpf,
      email: rep.email,
      telefone: rep.telefone,
      is_principal: Boolean(rep.is_principal),
    })
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.nome_completo ||
      !formData.nacionalidade ||
      !formData.estado_civil ||
      !formData.profissao ||
      !formData.rg ||
      !formData.cpf ||
      !formData.email ||
      !formData.telefone
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos da qualificação do representante.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      if (editingRep) {
        // Regra de integridade histórica: inativa o anterior e cria novo
        await representantesService.replaceWithNew(editingRep.id, {
          ...formData,
          empresa_id: empresaId,
          cliente_id: clienteId,
        })
        toast({
          title: 'Histórico preservado',
          description: 'O representante anterior foi inativado e uma nova versão ativa foi gerada.',
        })
      } else {
        await representantesService.create({
          ...formData,
          empresa_id: empresaId,
          cliente_id: clienteId,
        })
        toast({
          title: 'Sucesso',
          description: 'Representante legal cadastrado com sucesso!',
        })
      }
      setFormOpen(false)
      await loadRepresentantes()
      onChanged?.()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Falha ao salvar representante.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInativar = async (id: string) => {
    try {
      await representantesService.inativar(id)
      toast({
        title: 'Inativado',
        description: 'Representante inativado com sucesso. Registros históricos mantidos.',
      })
      await loadRepresentantes()
      onChanged?.()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao inativar representante.',
        variant: 'destructive',
      })
    }
  }

  const handleAtivar = async (id: string) => {
    try {
      await representantesService.ativar(id)
      toast({
        title: 'Ativado',
        description: 'Representante ativado com sucesso.',
      })
      await loadRepresentantes()
      onChanged?.()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao ativar representante.',
        variant: 'destructive',
      })
    }
  }

  const handleSetPrincipal = async (rep: RepresentanteLegal) => {
    try {
      await representantesService.setPrincipal(rep)
      toast({
        title: 'Principal definido',
        description: `${rep.nome_completo} agora é o representante principal.`,
      })
      await loadRepresentantes()
      onChanged?.()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao definir representante principal.',
        variant: 'destructive',
      })
    }
  }

  const activeCount = representantes.filter((r) => r.ativo !== false).length
  const hasPrincipal = representantes.some((r) => r.is_principal && r.ativo !== false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <DialogTitle>Representantes Legais: {entityName}</DialogTitle>
          </div>
          <DialogDescription>
            Toda empresa deve possuir um ou mais representantes legais qualificados, com um marcado
            como Principal. Para garantir integridade histórica, representantes nunca são
            sobrescritos nem apagados: edições geram novo registro e inativam o anterior.
          </DialogDescription>
        </DialogHeader>

        {!hasPrincipal && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-700 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Atenção:</strong> Esta empresa ainda não possui um representante legal
              principal ativo. Isso impedirá a geração de contratos até ser regularizado.
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-muted-foreground">
            {activeCount} ativo(s) / {representantes.length} histórico total
          </p>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Representante
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome & CPF</TableHead>
                <TableHead>Qualificação</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : representantes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum representante legal vinculado. Cadastre o primeiro acima.
                  </TableCell>
                </TableRow>
              ) : (
                representantes.map((rep) => {
                  const isAtivo = rep.ativo !== false
                  return (
                    <TableRow
                      key={rep.id}
                      className={!isAtivo ? 'opacity-60 bg-muted/20' : undefined}
                    >
                      <TableCell>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {rep.nome_completo}
                          {rep.is_principal && isAtivo && (
                            <Badge className="bg-primary text-[10px] py-0 px-1.5">Principal</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          CPF: {rep.cpf} | RG: {rep.rg}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>
                          {rep.nacionalidade}, {rep.estado_civil}
                        </div>
                        <div>{rep.profissao}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{rep.email}</div>
                        <div className="text-muted-foreground">{rep.telefone}</div>
                      </TableCell>
                      <TableCell>
                        {isAtivo ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-slate-500">
                            Inativo (Histórico)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {isAtivo && !rep.is_principal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary"
                            onClick={() => handleSetPrincipal(rep)}
                            title="Tornar Representante Principal"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Principal
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openEdit(rep)}
                          title="Atualizar dados (gera novo registro e inativa este)"
                        >
                          <History className="w-3.5 h-3.5 mr-1" />
                          Atualizar
                        </Button>
                        {isAtivo ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleInativar(rep.id)}
                            title="Inativar representante"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Inativar
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-emerald-600"
                            onClick={() => handleAtivar(rep.id)}
                            title="Reativar representante"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Reativar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>

        {/* Sub-dialog de Cadastro/Atualização com integridade histórica */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingRep
                  ? 'Atualizar Representante (Novo Registro Histórico)'
                  : 'Novo Representante Legal'}
              </DialogTitle>
              {editingRep && (
                <DialogDescription className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  Atenção: Os dados não sobrescreverão o cadastro anterior. O registro antigo será
                  inativado para preservar contratos assinados no passado, e um novo registro ativo
                  será gravado.
                </DialogDescription>
              )}
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  placeholder="Ex: João da Silva"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nacionalidade *</Label>
                  <Input
                    value={formData.nacionalidade}
                    onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                    placeholder="brasileiro(a)"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Estado Civil *</Label>
                  <Input
                    value={formData.estado_civil}
                    onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                    placeholder="casado(a), solteiro(a)..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Profissão *</Label>
                <Input
                  value={formData.profissao}
                  onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                  placeholder="Ex: administrador de empresas"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>RG com Órgão Emissor *</Label>
                  <Input
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="Ex: 25.172.699-X (SSP-SP)"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>CPF *</Label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="representante@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Telefone / WhatsApp *</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(43) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_principal_rep"
                  checked={formData.is_principal}
                  onChange={(e) => setFormData({ ...formData, is_principal: e.target.checked })}
                  className="w-4 h-4 rounded text-primary"
                />
                <Label htmlFor="is_principal_rep" className="text-xs cursor-pointer font-medium">
                  Definir como Representante Legal Principal desta empresa
                </Label>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Gravando...' : 'Gravar Representante'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
