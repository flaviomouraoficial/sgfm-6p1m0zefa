import React, { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { generateStaticPixPayload } from '@/lib/pixUtils'
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Coins,
} from 'lucide-react'

interface PixCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg: any
  settings: any
  user: any
  onOrderSuccess: () => void
}

export function PixCheckoutDialog({
  open,
  onOpenChange,
  pkg,
  settings,
  user,
  onOrderSuccess,
}: PixCheckoutDialogProps) {
  const { toast } = useToast()
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentProofNote, setPaymentProofNote] = useState('')

  if (!pkg) return null

  // Chave PIX cadastrada em v1_saas_settings
  const pixKey =
    settings?.pix_key?.trim() || settings?.contact_email || 'financeiro@trendconsultoria.com.br'

  const beneficiaryName =
    settings?.pix_beneficiary_name || settings?.company_name || 'Grupo Flavio Moura'
  const beneficiaryCity = settings?.pix_beneficiary_city || 'SAO PAULO'

  // Gerar payload Copia e Cola EMV oficial
  const pixCopiaECola = generateStaticPixPayload({
    pixKey,
    merchantName: beneficiaryName,
    merchantCity: beneficiaryCity,
    amount: pkg.price,
    txid: `CRED${pkg.credits}`,
    description: `Creditos ${pkg.name}`.slice(0, 25),
  })

  // Gerador de QR Code usando serviço universal seguro de SVG/Data
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    pixCopiaECola,
  )}`

  const handleCopyKey = () => {
    navigator.clipboard.writeText(pixKey)
    setCopiedKey(true)
    toast({ title: 'Chave PIX copiada!', description: pixKey })
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixCopiaECola)
    setCopiedPayload(true)
    toast({
      title: 'Código Copia e Cola copiado!',
      description: 'Abra o app do seu banco e escolha "Pix Copia e Cola".',
    })
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  const handleConfirmPaid = async () => {
    setIsSubmitting(true)
    try {
      // Criar o pedido em v1_saas_credit_purchases com status 'pendente'
      // O hook on_purchase_created_notify.js alertará os admins imediatamente
      await pb.collection('v1_saas_credit_purchases').create({
        client: user?.id,
        package: pkg.id,
        credits: pkg.credits,
        price_paid: pkg.price,
        status: 'pendente',
        payment_method: 'pix',
        notes: paymentProofNote
          ? `Pagamento via PIX. Comprovante/Obs: ${paymentProofNote}`
          : 'Pagamento via PIX informado pelo cliente ("Já paguei"). Aguardando conferência.',
      })

      toast({
        title: 'Pedido Registrado com Sucesso!',
        description:
          'Seu pedido está com status "Aguardando confirmação". O administrador foi notificado e liberará os créditos após a validação do PIX.',
      })

      onOrderSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao registrar pedido:', err)
      toast({
        title: 'Erro ao registrar pedido',
        description: err.message || 'Não foi possível salvar o pedido.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Checkout via PIX
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-semibold">
              Confirmação Manual
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Efetue o pagamento do pacote de créditos pelo seu banco usando o QR Code ou a chave
            abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumo do Pedido */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-primary" />
                {pkg.name} — {pkg.credits} créditos
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Liberação direta no saldo assim que o admin confirmar
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-primary">
                {formatCurrency(pkg.price)}
              </span>
            </div>
          </div>

          {/* QR Code e Código Copia e Cola */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted/20 border rounded-xl space-y-3">
            <div className="bg-white p-2.5 rounded-lg border shadow-sm flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code Pix"
                className="w-44 h-44 object-contain"
                loading="eager"
              />
            </div>

            <div className="text-center space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                Beneficiário: {beneficiaryName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Valor exato:{' '}
                <strong className="text-foreground">{formatCurrency(pkg.price)}</strong>
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs h-9 gap-1.5 font-medium"
                onClick={handleCopyPayload}
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" /> Código Copia e Cola Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-primary" /> Copiar Código PIX Copia e Cola
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background border px-2.5 py-1.5 rounded-md text-xs font-mono text-muted-foreground truncate">
                  Chave: <strong className="text-foreground">{pixKey}</strong>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs shrink-0 px-2"
                  onClick={handleCopyKey}
                >
                  {copiedKey ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Campo opcional de comprovante/identificador */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Identificação do Pagador / Comprovante (opcional)
            </Label>
            <Input
              placeholder="Ex: Nome da conta, ID da transação ou número do comprovante"
              value={paymentProofNote}
              onChange={(e) => setPaymentProofNote(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Ajuda nosso time financeiro a localizar e aprovar seu pagamento mais rápido.
            </p>
          </div>

          {/* Aviso sobre o fluxo */}
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Como funciona a liberação?
            </div>
            <p className="text-blue-800 leading-relaxed text-[11.5px]">
              Após clicar em <strong>"Já realizei o pagamento"</strong>, o pedido ficará com status{' '}
              <span className="font-semibold text-blue-950">Aguardando Confirmação</span>. O
              administrador confere o recebimento e aprova no painel, creditando os pontos
              automaticamente na sua conta.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Pagar mais tarde
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            onClick={handleConfirmPaid}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Registrando...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Já realizei o pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
