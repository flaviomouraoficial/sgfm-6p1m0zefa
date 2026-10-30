import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, ShieldAlert, KeyRound, Copy, Check, RefreshCw } from 'lucide-react'

interface UserTwoFactorConfigProps {
  userId: string
  isAdmin: boolean
}

export function UserTwoFactorConfig({ userId }: UserTwoFactorConfigProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [secret, setSecret] = useState('')
  const [otpauthUri, setOtpauthUri] = useState('')
  const [copied, setCopied] = useState(false)

  // Estados do fluxo de ativação
  const [activationCode, setActivationCode] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)

  // Estados do fluxo de desativação
  const [isDisabling, setIsDisabling] = useState(false)
  const [disableConfirmCode, setDisableConfirmCode] = useState('')

  const loadStatus = async () => {
    setLoading(true)
    try {
      const u = await pb.collection('users').getOne(userId)
      setEnabled(Boolean(u.two_factor_enabled))
      setSecret(u.two_factor_secret || '')
    } catch (err: any) {
      console.error('Erro ao ler status 2FA:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [userId])

  const handleStartSetup = async () => {
    setIsSettingUp(true)
    try {
      const res = await pb.send('/backend/v1/auth/2fa/setup', {
        method: 'POST',
      })
      setSecret(res.secret)
      setOtpauthUri(res.otpauth_uri)
      setEnabled(res.enabled)
    } catch (err: any) {
      toast({
        title: 'Erro ao iniciar configuração',
        description: err.message || 'Falha ao gerar chave 2FA.',
        variant: 'destructive',
      })
      setIsSettingUp(false)
    }
  }

  const handleCopySecret = () => {
    if (!secret) return
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copiado!', description: 'Chave secreta copiada para a área de transferência.' })
  }

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activationCode || activationCode.trim().length !== 6) {
      toast({
        title: 'Código Inválido',
        description: 'Digite o código de 6 dígitos exibido no seu aplicativo autenticador.',
        variant: 'destructive',
      })
      return
    }

    setIsActivating(true)
    try {
      await pb.send('/backend/v1/auth/2fa/enable', {
        method: 'POST',
        body: { code: activationCode.trim(), secret: secret },
      })
      setEnabled(true)
      setIsSettingUp(false)
      setActivationCode('')
      toast({
        title: '2FA Ativado!',
        description: 'Autenticação em duas etapas ativada com sucesso para sua conta.',
      })
      loadStatus()
    } catch (err: any) {
      toast({
        title: 'Código incorreto',
        description: err.message || 'O código digitado não confere ou expirou. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsActivating(false)
    }
  }

  const handleDisable2FA = async () => {
    if (
      !window.confirm(
        'Tem certeza que deseja desativar a autenticação em duas etapas? Sua conta ficará menos protegida.',
      )
    ) {
      return
    }

    setIsDisabling(true)
    try {
      await pb.send('/backend/v1/auth/2fa/disable', {
        method: 'POST',
        body: { code: disableConfirmCode.trim() || undefined },
      })
      setEnabled(false)
      setOtpauthUri('')
      setDisableConfirmCode('')
      toast({
        title: '2FA Desativado',
        description: 'A autenticação em duas etapas foi desativada.',
      })
      loadStatus()
    } catch (err: any) {
      toast({
        title: 'Erro ao desativar',
        description: err.message || 'Falha ao desativar 2FA.',
        variant: 'destructive',
      })
    } finally {
      setIsDisabling(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
        <span>Verificando configurações de segurança...</span>
      </div>
    )
  }

  // Gera URL do QR code via quickchart / QR server padrão
  const qrCodeUrl = otpauthUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUri)}`
    : ''

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-lg border">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
          >
            {enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Autenticação em Duas Etapas (2FA)</span>
              {enabled ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px]">
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                  Desativado
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exige código TOTP gerado no Google Authenticator, Authy ou similar a cada login.
            </p>
          </div>
        </div>

        <div>
          {enabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable2FA}
              disabled={isDisabling}
              className="text-destructive hover:bg-destructive/10 text-xs"
            >
              {isDisabling ? 'Desativando...' : 'Desativar 2FA'}
            </Button>
          ) : !isSettingUp ? (
            <Button size="sm" onClick={handleStartSetup} className="text-xs">
              Configurar 2FA
            </Button>
          ) : null}
        </div>
      </div>

      {/* Formulário de ativação com QR code e chave */}
      {isSettingUp && !enabled && (
        <div className="p-4 bg-card rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              Passo 1: Escaneie o QR Code no seu aplicativo autenticador
            </h4>
            <p className="text-xs text-muted-foreground">
              Abra seu aplicativo (Google Authenticator, Microsoft Authenticator, Authy ou
              1Password) e aponte a câmera para o QR Code abaixo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-muted/20 rounded-lg border">
            {qrCodeUrl ? (
              <div className="bg-white p-2 rounded-lg border shadow-sm shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="QR Code 2FA TOTP"
                  className="w-40 h-40 object-contain"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="w-40 h-40 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Gerando QR...
              </div>
            )}

            <div className="space-y-3 flex-1 w-full">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Ou digite a chave secreta manualmente no app:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={secret}
                    className="font-mono text-xs bg-background tracking-wider"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                    className="shrink-0"
                    title="Copiar chave secreta"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-2.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded text-xs">
                Tipo: Baseado em tempo (TOTP) | 6 dígitos | Intervalo: 30s
              </div>
            </div>
          </div>

          <form onSubmit={handleEnable2FA} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-foreground">
                Passo 2: Digite o código de 6 dígitos gerado pelo app para confirmar
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-[200px]">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-9 font-mono text-base tracking-widest text-center"
                    required
                  />
                </div>
                <Button type="submit" disabled={isActivating || activationCode.length !== 6}>
                  {isActivating ? 'Validando...' : 'Confirmar e Ativar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSettingUp(false)}
                  disabled={isActivating}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {enabled && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Proteção 2FA ativa nesta conta</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              No próximo login com usuário e senha, será solicitado o código gerado no seu
              aplicativo autenticador antes de liberar o acesso.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
