import React, { useState } from 'react'
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
import { Building2, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { representantesService } from '@/services/representantes'
import { Client, RepresentanteLegal } from '@/lib/types'

interface QuickClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (cliente: Client, rep: RepresentanteLegal) => void
}

export function QuickClientDialog({ open, onOpenChange, onCreated }: QuickClientDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [cliForm, setCliForm] = useState({
    name: '',
    razao_social: '',
    cnpj: '',
    email: '',
    email_notificacoes: '',
    phone: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: 'Londrina',
    estado: 'PR',
    cep: '',
  })

  const [repForm, setRepForm] = useState({
    nome_completo: '',
    nacionalidade: 'brasileiro(a)',
    estado_civil: 'casado(a)',
    profissao: 'administrador(a)',
    rg: '',
    cpf: '',
    email: '',
    telefone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cliForm.name || !cliForm.cnpj || !cliForm.email_notificacoes) {
      toast({
        title: 'Campos do Cliente',
        description: 'Preencha Razão Social, CNPJ e E-mail de Notificações.',
        variant: 'destructive',
      })
      return
    }

    if (
      !repForm.nome_completo ||
      !repForm.cpf ||
      !repForm.rg ||
      !repForm.email ||
      !repForm.telefone
    ) {
      toast({
        title: 'Campos do Representante',
        description: 'Preencha todos os campos do representante legal principal.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      // 1. Criar Cliente
      const clientRecord = await pb.collection('v1_clientes').create<Client>({
        name: cliForm.name,
        razao_social: cliForm.razao_social || cliForm.name,
        cnpj: cliForm.cnpj,
        email: cliForm.email || cliForm.email_notificacoes,
        email_notificacoes: cliForm.email_notificacoes,
        phone: cliForm.phone,
        logradouro: cliForm.logradouro,
        numero: cliForm.numero,
        bairro: cliForm.bairro,
        cidade: cliForm.cidade,
        estado: cliForm.estado,
        cep: cliForm.cep,
        status: 'active',
      })

      // 2. Criar Representante Legal Principal vinculado ao Cliente
      const repRecord = await representantesService.create({
        nome_completo: repForm.nome_completo,
        nacionalidade: repForm.nacionalidade,
        estado_civil: repForm.estado_civil,
        profissao: repForm.profissao,
        rg: repForm.rg,
        cpf: repForm.cpf,
        email: repForm.email,
        telefone: repForm.telefone,
        is_principal: true,
        ativo: true,
        cliente_id: clientRecord.id,
      })

      toast({
        title: 'Cliente e Representante Cadastrados',
        description: 'Os dados foram salvos no banco e já estão carregados no contrato.',
      })

      onCreated(clientRecord, repRecord)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: err.message || 'Falha ao salvar cliente e representante.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <DialogTitle>Cadastrar Novo Cliente Contratante</DialogTitle>
          </div>
          <DialogDescription>
            Cadastre os dados completos da empresa cliente e do seu representante legal principal
            diretamente nesta tela para prosseguir com o contrato.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Seção 1: Empresa Contratante */}
          <div className="space-y-3 p-3 bg-muted/20 border rounded-lg">
            <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 uppercase">
              <Building2 className="w-4 h-4" /> Dados Cadastrais da Empresa
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Razão Social / Nome *</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.name}
                  onChange={(e) =>
                    setCliForm({ ...cliForm, name: e.target.value, razao_social: e.target.value })
                  }
                  placeholder="Ex: Indústria XYZ Ltda"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CNPJ *</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.cnpj}
                  onChange={(e) => setCliForm({ ...cliForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">E-mail p/ Notificações Contratuais *</Label>
                <Input
                  type="email"
                  className="h-8 text-xs"
                  value={cliForm.email_notificacoes}
                  onChange={(e) => setCliForm({ ...cliForm, email_notificacoes: e.target.value })}
                  placeholder="contratos@cliente.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefone / WhatsApp</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.phone}
                  onChange={(e) => setCliForm({ ...cliForm, phone: e.target.value })}
                  placeholder="(43) 3333-3333"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Endereço (Logradouro)</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.logradouro}
                  onChange={(e) => setCliForm({ ...cliForm, logradouro: e.target.value })}
                  placeholder="Av. Tiradentes"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Número</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.numero}
                  onChange={(e) => setCliForm({ ...cliForm, numero: e.target.value })}
                  placeholder="500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Bairro</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.bairro}
                  onChange={(e) => setCliForm({ ...cliForm, bairro: e.target.value })}
                  placeholder="Centro"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cidade</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.cidade}
                  onChange={(e) => setCliForm({ ...cliForm, cidade: e.target.value })}
                  placeholder="Londrina"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">UF</Label>
                <Input
                  className="h-8 text-xs"
                  value={cliForm.estado}
                  onChange={(e) => setCliForm({ ...cliForm, estado: e.target.value })}
                  placeholder="PR"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Representante Legal Principal */}
          <div className="space-y-3 p-3 bg-muted/20 border rounded-lg">
            <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 uppercase">
              <Users className="w-4 h-4" /> Representante Legal Principal da Contratante
            </h4>

            <div className="space-y-1">
              <Label className="text-xs">Nome Completo *</Label>
              <Input
                className="h-8 text-xs"
                value={repForm.nome_completo}
                onChange={(e) => setRepForm({ ...repForm, nome_completo: e.target.value })}
                placeholder="Ex: Carlos Eduardo dos Santos"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Nacionalidade *</Label>
                <Input
                  className="h-8 text-xs"
                  value={repForm.nacionalidade}
                  onChange={(e) => setRepForm({ ...repForm, nacionalidade: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estado Civil *</Label>
                <Input
                  className="h-8 text-xs"
                  value={repForm.estado_civil}
                  onChange={(e) => setRepForm({ ...repForm, estado_civil: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Profissão *</Label>
                <Input
                  className="h-8 text-xs"
                  value={repForm.profissao}
                  onChange={(e) => setRepForm({ ...repForm, profissao: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">RG com Órgão Emissor *</Label>
                <Input
                  className="h-8 text-xs"
                  value={repForm.rg}
                  onChange={(e) => setRepForm({ ...repForm, rg: e.target.value })}
                  placeholder="00.000.000-0 SSP/PR"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CPF *</Label>
                <Input
                  className="h-8 text-xs"
                  value={repForm.cpf}
                  onChange={(e) => setRepForm({ ...repForm, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">E-mail do Representante *</Label>
                <Input
                  type="email"
                  className="h-8 text-xs"
                  value={repForm.email}
                  onChange={(e) => setRepForm({ ...repForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefone do Representante *</Label>
                <Input
                  className="h-8 text-xs"
                  value={repForm.telefone}
                  onChange={(e) => setRepForm({ ...repForm, telefone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Gravando no Cadastro...' : 'Salvar no Cadastro & Usar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
