import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Recibo } from '@/lib/types'
import { useFinanceStore } from '@/stores/finance'

export function ReceiptForm({
  open,
  onOpenChange,
  recibo,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  recibo?: Recibo | null
}) {
  const { toast } = useToast()
  const { contas, fetchContas } = useFinanceStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'Pagar',
    status: 'Pendente',
    data_criacao: format(new Date(), 'yyyy-MM-dd'),
    cliente_nome: '',
    cliente_documento: '',
    nf_numero: '',
    nf_data: '',
    nf_descricao: '',
    nf_valor_total: '',
    banco: '',
    agencia_conta: '',
    transacao_descricao: '',
  })
  const [itens, setItens] = useState([{ descricao: '', qtd: 1, valor_unitario: 0 }])

  useEffect(() => {
    if (open) {
      if (recibo) {
        setFormData({
          tipo: recibo.tipo || 'Pagar',
          status: recibo.status || 'Pendente',
          data_criacao: recibo.data_criacao
            ? format(new Date(recibo.data_criacao), 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd'),
          cliente_nome: recibo.cliente_nome || '',
          cliente_documento: recibo.cliente_documento || '',
          nf_numero: recibo.nf_numero || '',
          nf_data: recibo.nf_data ? format(new Date(recibo.nf_data), 'yyyy-MM-dd') : '',
          nf_descricao: recibo.nf_descricao || '',
          nf_valor_total: recibo.nf_valor_total?.toString() || '',
          banco: recibo.banco || '',
          agencia_conta: recibo.agencia_conta || '',
          transacao_descricao: recibo.nf_descricao || '',
        })
        setItens(
          recibo.itens?.length ? recibo.itens : [{ descricao: '', qtd: 1, valor_unitario: 0 }],
        )
      } else {
        setFormData({
          tipo: 'Pagar',
          status: 'Pendente',
          data_criacao: format(new Date(), 'yyyy-MM-dd'),
          cliente_nome: '',
          cliente_documento: '',
          nf_numero: '',
          nf_data: '',
          nf_descricao: '',
          nf_valor_total: '',
          banco: '',
          agencia_conta: '',
          transacao_descricao: '',
        })
        setItens([{ descricao: '', qtd: 1, valor_unitario: 0 }])
      }
    }
  }, [open, recibo])

  useEffect(() => {
    fetchContas()
  }, [fetchContas])

  const subtotal = itens.reduce((acc, item) => acc + item.qtd * item.valor_unitario, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isNaN(subtotal) || subtotal <= 0) {
      toast({
        title: 'Atenção',
        description: 'O valor da transação deve ser um número válido maior que zero.',
        variant: 'destructive',
      })
      return
    }

    const valorNF = parseFloat(formData.nf_valor_total) || 0
    if (formData.nf_valor_total && Math.abs(subtotal - valorNF) > 0.01) {
      toast({
        title: 'Atenção',
        description: 'Corrija a discrepância entre os valores antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      if (recibo) {
        const payload = {
          ...formData,
          nf_valor_total: parseFloat(formData.nf_valor_total) || 0,
          subtotal,
          itens: itens.map((i) => ({ ...i, total: i.qtd * i.valor_unitario })),
        }
        if (!payload.nf_data) delete (payload as any).nf_data
        await pb.collection('v1_recibos').update(recibo.id, payload)

        try {
          const existingTx = await pb
            .collection('v1_transactions')
            .getFirstListItem(`recibo_id = "${recibo.id}"`)
          await pb.collection('v1_transactions').update(existingTx.id, {
            description:
              formData.transacao_descricao ||
              formData.nf_descricao ||
              formData.cliente_nome ||
              'Recibo',
            amount: subtotal,
            type: formData.tipo === 'Receber' ? 'Receita' : 'Despesa',
            date: new Date(formData.data_criacao + 'T00:00:00').toISOString(),
          })
        } catch (txErr) {
          try {
            await pb.collection('v1_transactions').create({
              description:
                formData.transacao_descricao ||
                formData.nf_descricao ||
                formData.cliente_nome ||
                'Recibo',
              amount: subtotal,
              type: formData.tipo === 'Receber' ? 'Receita' : 'Despesa',
              status: 'Pendente',
              category: 'Recibo',
              date: new Date(formData.data_criacao + 'T00:00:00').toISOString(),
              recibo_id: recibo.id,
            })
          } catch (createErr) {
            console.error('Failed to create transaction for recibo', createErr)
          }
        }

        toast({ title: 'Recibo atualizado com sucesso!' })
        onOpenChange(false)
      } else {
        const payload = {
          ...formData,
          numero: 'PENDING',
          nf_valor_total: parseFloat(formData.nf_valor_total) || 0,
          subtotal,
          itens: itens.map((i) => ({ ...i, total: i.qtd * i.valor_unitario })),
        }

        if (!payload.nf_data) delete (payload as any).nf_data

        const createdRecibo = await pb.collection('v1_recibos').create(payload)

        try {
          await pb.collection('v1_transactions').create({
            description:
              formData.transacao_descricao ||
              formData.nf_descricao ||
              formData.cliente_nome ||
              'Recibo',
            amount: subtotal,
            type: formData.tipo === 'Receber' ? 'Receita' : 'Despesa',
            status: 'Pendente',
            category: 'Recibo',
            date: new Date(formData.data_criacao + 'T00:00:00').toISOString(),
            recibo_id: createdRecibo.id,
          })
        } catch (txErr) {
          console.error('Failed to create transaction for recibo', txErr)
        }

        toast({ title: 'Recibo criado com sucesso!' })
        onOpenChange(false)
      }
    } catch (err: any) {
      toast({ title: 'Erro ao salvar recibo', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, val: string) =>
    setFormData((prev) => ({ ...prev, [field]: val }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{recibo ? 'Editar Recibo' : 'Novo Recibo'}</SheetTitle>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Trend Consultoria LTDA - CNPJ 09.465.223/0001-07
          </p>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Transação</Label>
              <Select value={formData.tipo} onValueChange={(v) => handleChange('tipo', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receber">Crédito (Receber)</SelectItem>
                  <SelectItem value="Pagar">Débito (Pagar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data da Criação</Label>
              <Input
                type="date"
                required
                value={formData.data_criacao}
                onChange={(e) => handleChange('data_criacao', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <h4 className="font-medium">Dados da Transação</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descrição da Transação</Label>
                <Input
                  required
                  placeholder="Descrição para o lançamento financeiro"
                  value={formData.transacao_descricao}
                  onChange={(e) => handleChange('transacao_descricao', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da Transação (Subtotal)</Label>
                <Input
                  type="number"
                  step="0.01"
                  readOnly
                  value={subtotal.toFixed(2)}
                  className="bg-muted/50 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <h4 className="font-medium">Dados do Cliente</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  required
                  value={formData.cliente_nome}
                  onChange={(e) => handleChange('cliente_nome', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input
                  value={formData.cliente_documento}
                  onChange={(e) => handleChange('cliente_documento', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <h4 className="font-medium">Dados da Nota Fiscal (NF)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número NF</Label>
                <Input
                  value={formData.nf_numero}
                  onChange={(e) => handleChange('nf_numero', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data NF</Label>
                <Input
                  type="date"
                  value={formData.nf_data}
                  onChange={(e) => handleChange('nf_data', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total NF</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.nf_valor_total}
                  onChange={(e) => handleChange('nf_valor_total', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.nf_descricao}
                  onChange={(e) => handleChange('nf_descricao', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <h4 className="font-medium">Dados Bancários</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Select
                  value={formData.banco || undefined}
                  onValueChange={(v) => handleChange('banco', v === '__none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.banco && !contas.some((conta) => conta.nome === formData.banco) && (
                      <SelectItem value={formData.banco}>
                        {formData.banco} (Atual / Legado)
                      </SelectItem>
                    )}
                    {contas.map((conta) => (
                      <SelectItem key={conta.id} value={conta.nome}>
                        {conta.nome}
                      </SelectItem>
                    ))}
                    {contas.length === 0 && !formData.banco && (
                      <SelectItem value="__none" disabled>
                        Nenhuma conta cadastrada
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agência/Conta</Label>
                <Input
                  value={formData.agencia_conta}
                  onChange={(e) => handleChange('agencia_conta', e.target.value)}
                />
              </div>
            </div>
          </div>

          {formData.nf_valor_total &&
            Math.abs(subtotal - (parseFloat(formData.nf_valor_total) || 0)) > 0.01 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Discrepância de Valores</AlertTitle>
                <AlertDescription>
                  O valor total da NF (R${' '}
                  {(parseFloat(formData.nf_valor_total) || 0).toFixed(2).replace('.', ',')}) é
                  diferente do subtotal dos itens (R$ {subtotal.toFixed(2).replace('.', ',')}).
                </AlertDescription>
              </Alert>
            )}

          <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Itens de Despesa</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItens([...itens, { descricao: '', qtd: 1, valor_unitario: 0 }])}
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            {itens.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={item.descricao}
                    onChange={(e) => {
                      const newItens = [...itens]
                      newItens[idx].descricao = e.target.value
                      setItens(newItens)
                    }}
                    required
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.qtd}
                    onChange={(e) => {
                      const newItens = [...itens]
                      newItens[idx].qtd = parseInt(e.target.value) || 1
                      setItens(newItens)
                    }}
                    required
                  />
                </div>
                <div className="w-28">
                  <Label className="text-xs">V. Unitário</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.valor_unitario}
                    onChange={(e) => {
                      const newItens = [...itens]
                      newItens[idx].valor_unitario = parseFloat(e.target.value) || 0
                      setItens(newItens)
                    }}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setItens(itens.filter((_, i) => i !== idx))}
                  disabled={itens.length === 1}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <div className="text-right font-bold mt-2 pt-2 border-t">
              Subtotal: R$ {subtotal.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Recibo'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
