import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Save, FileText, Plus, RefreshCw } from 'lucide-react'
import type { ProposalFormData } from '@/lib/proposal-defaults'

interface Props {
  formData: ProposalFormData
  setFormData: (d: ProposalFormData) => void
  clients: { id: string; name: string }[]
  editingId: string | null
  isSaving: boolean
  onSave: () => void
  onNew: () => void
  onGeneratePDF: () => void
}

export function ProposalForm({
  formData,
  setFormData,
  clients,
  editingId,
  isSaving,
  onSave,
  onNew,
  onGeneratePDF,
}: Props) {
  const [comboOpen, setComboOpen] = useState(false)
  const u = (f: keyof ProposalFormData, v: string) => setFormData({ ...formData, [f]: v })
  const lbl = (label: string, el: React.ReactNode, full = false) => (
    <div className={cn('space-y-1', full && 'md:col-span-full')}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {el}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">
            Cliente <span className="text-red-500">*</span>
          </Label>
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                {formData.cliente_id
                  ? clients.find((c) => c.id === formData.cliente_id)?.name
                  : 'Selecione o cliente...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar cliente..." />
                <CommandList>
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {clients.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
                          u('cliente_id', c.id)
                          if (!formData.nome_contato) u('nome_contato', c.name)
                          setComboOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            formData.cliente_id === c.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {lbl(
          'Nome do Contato',
          <Input
            value={formData.nome_contato}
            onChange={(e) => u('nome_contato', e.target.value)}
          />,
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lbl(
          'Nome do Evento *',
          <Input
            required
            value={formData.nome_evento}
            onChange={(e) => u('nome_evento', e.target.value)}
          />,
        )}
        {lbl(
          'Local',
          <Input value={formData.local} onChange={(e) => u('local', e.target.value)} />,
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {lbl(
          'Formato',
          <Input value={formData.formato} onChange={(e) => u('formato', e.target.value)} />,
        )}
        {lbl(
          'Validade da Proposta',
          <Input
            value={formData.validade_proposta}
            onChange={(e) => u('validade_proposta', e.target.value)}
          />,
        )}
        {lbl(
          'Data de Geração',
          <Input
            type="date"
            value={formData.data_geracao}
            onChange={(e) => u('data_geracao', e.target.value)}
          />,
        )}
      </div>

      {lbl(
        'Objetivo',
        <Textarea
          rows={3}
          value={formData.objetivo}
          onChange={(e) => u('objetivo', e.target.value)}
        />,
        true,
      )}
      {lbl(
        'Público-alvo',
        <Textarea
          rows={3}
          value={formData.publico_alvo}
          onChange={(e) => u('publico_alvo', e.target.value)}
        />,
        true,
      )}
      {lbl(
        'Cronograma',
        <Textarea
          rows={3}
          value={formData.cronograma}
          onChange={(e) => u('cronograma', e.target.value)}
        />,
        true,
      )}
      {lbl(
        'Estrutura do Programa',
        <Textarea
          rows={3}
          value={formData.estrutura_programa}
          onChange={(e) => u('estrutura_programa', e.target.value)}
        />,
        true,
      )}
      {lbl(
        'Serviços Oferecidos',
        <Textarea
          rows={4}
          value={formData.description}
          onChange={(e) => u('description', e.target.value)}
        />,
        true,
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {lbl(
          'Valor Módulo 4h',
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_modulo_4h}
            onChange={(e) => u('valor_modulo_4h', e.target.value)}
          />,
        )}
        {lbl(
          'Valor Módulo 8h',
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_modulo_8h}
            onChange={(e) => u('valor_modulo_8h', e.target.value)}
          />,
        )}
        {lbl(
          'Valor Global',
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.valor_global}
            onChange={(e) => u('valor_global', e.target.value)}
          />,
        )}
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Status</Label>
          <Select value={formData.status} onValueChange={(v) => u('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="em análise">Em Análise</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="reprovado">Reprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {lbl(
        'Condições de Pagamento',
        <Textarea
          rows={2}
          value={formData.condicoes_pagamento}
          onChange={(e) => u('condicoes_pagamento', e.target.value)}
        />,
        true,
      )}
      {lbl(
        'Quem Somos (Texto Institucional)',
        <Textarea
          rows={5}
          value={formData.texto_institucional}
          onChange={(e) => u('texto_institucional', e.target.value)}
        />,
        true,
      )}
      {lbl(
        'Condições Gerais',
        <Textarea
          rows={5}
          value={formData.condicoes_gerais}
          onChange={(e) => u('condicoes_gerais', e.target.value)}
        />,
        true,
      )}
      {lbl(
        'Perfil do Instrutor',
        <Textarea
          rows={5}
          value={formData.perfil_instrutor}
          onChange={(e) => u('perfil_instrutor', e.target.value)}
        />,
        true,
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {editingId ? 'Atualizar Proposta' : 'Salvar Proposta'}
        </Button>
        <Button variant="outline" onClick={onNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Proposta
        </Button>
        <Button variant="secondary" onClick={onGeneratePDF}>
          <FileText className="w-4 h-4 mr-2" /> Gerar PDF
        </Button>
      </div>
    </div>
  )
}
