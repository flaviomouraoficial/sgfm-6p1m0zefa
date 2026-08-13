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
  setFormData: React.Dispatch<React.SetStateAction<ProposalFormData>>
  clients: { id: string; name: string }[]
  editingId: string | null
  isSaving: boolean
  onSave: () => void
  onNew: () => void
  onGeneratePDF: () => void
}

import { Trash2 } from 'lucide-react'
import { useMainStore } from '@/stores/main'
import { createEmptyCondicao, type CondicaoComercialItem } from '@/lib/proposal-defaults'

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
  const { systemSettings } = useMainStore()
  const defaultIvaPercent = systemSettings?.defaultIvaPercent ?? 0
  const [comboOpen, setComboOpen] = useState(false)
  const u = (f: keyof ProposalFormData, v: any) => setFormData((prev) => ({ ...prev, [f]: v }))
  const lbl = (label: string, el: React.ReactNode, full = false) => (
    <div className={cn('space-y-1', full && 'md:col-span-full')}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {el}
    </div>
  )

  const handleCondicaoChange = (index: number, field: keyof CondicaoComercialItem, val: string) => {
    setFormData((prev) => {
      const list = [...(prev.condicoes_comerciais || [])]
      const item = { ...list[index], [field]: val }

      if (field === 'valor_global') {
        const global = parseFloat(val) || 0
        const creditado = (global * defaultIvaPercent) / 100
        const liquido = global - creditado
        item.valor_creditado = creditado.toFixed(2)
        item.valor_liquido = liquido.toFixed(2)
      }

      list[index] = item

      // Also sync overall valor_global with the first condition's valor_global
      const firstVal = list[0]?.valor_global || ''
      return {
        ...prev,
        valor_global: firstVal,
        condicoes_comerciais: list,
      }
    })
  }

  const addCondicaoRow = () => {
    setFormData((prev) => {
      const list = [...(prev.condicoes_comerciais || [])]
      list.push(createEmptyCondicao(defaultIvaPercent))
      return { ...prev, condicoes_comerciais: list }
    })
  }

  const removeCondicaoRow = (index: number) => {
    setFormData((prev) => {
      const list = [...(prev.condicoes_comerciais || [])]
      if (list.length <= 1) return prev
      list.splice(index, 1)
      const firstVal = list[0]?.valor_global || ''
      return {
        ...prev,
        valor_global: firstVal,
        condicoes_comerciais: list,
      }
    })
  }

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
                          setFormData((prev) => ({
                            ...prev,
                            cliente_id: c.id,
                            nome_contato: prev.nome_contato || c.name,
                          }))
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

      {/* Condições Comerciais / Investimento Dynamic Table */}
      <div className="space-y-3 pt-2 pb-2 border-y my-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-accent">
              Condições Comerciais (Investimento)
            </h3>
            <p className="text-xs text-muted-foreground">
              Insira uma ou mais opções de valores para a proposta. IVA aplicado:{' '}
              {defaultIvaPercent}%
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCondicaoRow}>
            <Plus className="w-4 h-4 mr-1" /> + Adicionar Condição
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-muted-foreground uppercase font-medium">
              <tr>
                <th className="px-3 py-2">Valor Módulo (R$)</th>
                <th className="px-3 py-2">Valor Global (R$)</th>
                <th className="px-3 py-2">Valor Creditado ({defaultIvaPercent}% IVA)</th>
                <th className="px-3 py-2">Valor Líquido (R$)</th>
                <th className="px-3 py-2">Prazo de Pagamento</th>
                <th className="px-2 py-2 text-center w-12">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(formData.condicoes_comerciais || []).map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-muted/50">
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="h-8 text-xs"
                      value={row.valor_modulo}
                      onChange={(e) => handleCondicaoChange(idx, 'valor_modulo', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="h-8 text-xs font-semibold"
                      value={row.valor_global}
                      onChange={(e) => handleCondicaoChange(idx, 'valor_global', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      readOnly
                      disabled
                      className="h-8 text-xs bg-muted/60 text-muted-foreground font-mono"
                      value={
                        row.valor_creditado
                          ? `R$ ${parseFloat(row.valor_creditado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'R$ 0,00'
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      readOnly
                      disabled
                      className="h-8 text-xs bg-muted/60 text-emerald-700 font-semibold font-mono dark:text-emerald-400"
                      value={
                        row.valor_liquido
                          ? `R$ ${parseFloat(row.valor_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'R$ 0,00'
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      placeholder="ex: 30 dias / 3x no cartão"
                      className="h-8 text-xs"
                      value={row.prazo_pagamento}
                      onChange={(e) => handleCondicaoChange(idx, 'prazo_pagamento', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      disabled={(formData.condicoes_comerciais || []).length <= 1}
                      onClick={() => removeCondicaoRow(idx)}
                      title="Remover linha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
