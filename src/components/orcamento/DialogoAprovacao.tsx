import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { fmtPct, limiteDescontoUsuario, type AlcadaDesconto } from '@/lib/orcamento'

interface DialogoAprovacaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  descontoPct: number
  limitePct: number | null
  user: any
  alcadas: AlcadaDesconto[]
  onConfirm: (aprovadorEmail: string, aprovadorNome: string, motivo: string) => Promise<void>
}

/**
 * Desconto acima da alçada do perfil: exige aprovador + motivo.
 * O registro fica no escopo_json.aprovacao_interna da versão (v1_alcadas_desconto
 * não guarda autorizante — regra da peça 4 da migração 0098).
 */
export function DialogoAprovacao({
  open,
  onOpenChange,
  descontoPct,
  limitePct,
  user,
  alcadas,
  onConfirm,
}: DialogoAprovacaoProps) {
  const [aprovadorEmail, setAprovadorEmail] = useState('')
  const [aprovadorNome, setAprovadorNome] = useState('')
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const submit = async () => {
    if (!aprovadorEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(aprovadorEmail.trim())) {
      toast({
        title: 'Atenção',
        description: 'Informe o e-mail do aprovador.',
        variant: 'destructive',
      })
      return
    }
    if (!motivo.trim()) {
      toast({
        title: 'Atenção',
        description: 'Descreva o motivo do desconto.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      await onConfirm(
        aprovadorEmail.trim(),
        aprovadorNome.trim() || aprovadorEmail.trim(),
        motivo.trim(),
      )
      setAprovadorEmail('')
      setAprovadorNome('')
      setMotivo('')
      onOpenChange(false)
    } finally {
      setSalvando(false)
    }
  }

  const perfilNome = String(user?.role || 'sem perfil')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aprovação de desconto exigida</DialogTitle>
          <DialogDescription>
            Desconto de <strong>{fmtPct(descontoPct)}</strong> excede a alçada do seu perfil
            {limitePct !== null ? ` (${fmtPct(limitePct)})` : ''} — perfil{' '}
            <strong>{perfilNome}</strong>. Informe quem autorizou e o motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">E-mail do aprovador *</Label>
            <Input
              value={aprovadorEmail}
              onChange={(e) => setAprovadorEmail(e.target.value)}
              placeholder="aprovador@empresa.com.br"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do aprovador</Label>
            <Input
              value={aprovadorNome}
              onChange={(e) => setAprovadorNome(e.target.value)}
              placeholder="Opcional — se diferente do e-mail"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Motivo *</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: fechamento estratégico para conta nova, concorrência direta..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar e salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
