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
import { Trash2, Plus } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Recibo } from '@/lib/types'

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
        })
        setItens([{ descricao: '', qtd: 1, valor_unitario: 0 }])
      }
    }
  }, [open, recibo])

  const subtotal = itens.reduce((acc, item) => acc + item.qtd * item.valor_unitario, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        toast({ title: 'Recibo atualizado com sucesso!' })
        onOpenChange(false)
      } else {
        const year = new Date().getFullYear()
        const prefix = `REC-${year}-`
        const lastRecibos = await pb
          .collection('v1_recibos')
          .getList(1, 1, { filter: `numero ~ '${prefix}'`, sort: '-numero' })
        let nextSeq = 1
        if (lastRecibos.items.length > 0) {
          nextSeq = parseInt(lastRecibos.items[0].numero.split('-')[2], 10) + 1
        }
        const numero = `${prefix}${nextSeq.toString().padStart(5, '0')}`

        const payload = {
          ...formData,
          numero,
          nf_valor_total: parseFloat(formData.nf_valor_total) || 0,
          subtotal,
          itens: itens.map((i) => ({ ...i, total: i.qtd * i.valor_unitario })),
        }

        if (!payload.nf_data) delete (payload as any).nf_data

        await pb.collection('v1_recibos').create(payload)
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
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => handleChange('tipo', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receber">Receber</SelectItem>
                  <SelectItem value="Pagar">Pagar</SelectItem>
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
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
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
                <Input
                  value={formData.banco}
                  onChange={(e) => handleChange('banco', e.target.value)}
                />
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
