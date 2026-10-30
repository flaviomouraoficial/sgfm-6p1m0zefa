import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, checkIsAdmin } from '@/hooks/use-auth'
import { useMainStore } from '@/stores/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useToast } from '@/hooks/use-toast'
import { RefreshCw, ArrowRight, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react'

export default function Login() {
  const { signIn, verify2FA, user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Estados do fluxo de 2FA
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [isVerifying2FA, setIsVerifying2FA] = useState(false)

  const fromPath = location.state?.from?.pathname

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (checkIsAdmin(user) || user.role === 'admin') {
        useMainStore.getState().setCurrentPath('/admin')
        const destination =
          !fromPath || fromPath === '/' || fromPath === '/login' || !fromPath.startsWith('/admin')
            ? '/admin'
            : fromPath
        navigate(destination, { replace: true })
      } else if (user.role === 'client') {
        useMainStore.getState().setCurrentPath('/portal')
        const destination =
          !fromPath || fromPath === '/' || fromPath === '/login' ? '/portal' : fromPath
        navigate(destination, { replace: true })
      } else {
        useMainStore.getState().setCurrentPath('/dashboard')
        const destination =
          !fromPath || fromPath === '/' || fromPath === '/login' ? '/dashboard' : fromPath
        navigate(destination, { replace: true })
      }
    }
  }, [user, authLoading, navigate, fromPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha o usuário e a senha.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    const result = await signIn(username, password)

    if (result.error) {
      toast({
        title: 'Acesso Negado',
        description:
          result.error.message === 'Usuário sem papel (role) definido.'
            ? 'Erro de acesso: Usuário sem permissões (role) definidas. Contate o suporte.'
            : 'Credenciais inválidas. Verifique seu usuário e senha.',
        variant: 'destructive',
      })
      setIsLoading(false)
    } else if (result.requires2FA && result.tempUser) {
      setIsLoading(false)
      setRequires2FA(true)
      setTwoFactorUserId(result.tempUser.id)
      setTotpCode('')
      toast({
        title: 'Verificação em Duas Etapas',
        description: 'Digite o código de 6 dígitos gerado pelo seu app autenticador.',
      })
    } else {
      toast({
        title: 'Acesso Liberado',
        description: 'Bem-vindo ao sistema!',
      })
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twoFactorUserId) return

    if (!totpCode || totpCode.trim().length !== 6) {
      toast({
        title: 'Código Inválido',
        description: 'O código de autenticação deve ter 6 dígitos numéricos.',
        variant: 'destructive',
      })
      return
    }

    setIsVerifying2FA(true)
    const { error } = await verify2FA(twoFactorUserId, totpCode.trim())

    if (error) {
      toast({
        title: 'Código Incorreto',
        description: error.message || 'Código de 6 dígitos incorreto ou expirado. Tente novamente.',
        variant: 'destructive',
      })
      setIsVerifying2FA(false)
    } else {
      toast({
        title: '2FA Confirmado',
        description: 'Acesso concedido com sucesso!',
      })
      // O useEffect detecta isAuthenticated e redireciona
    }
  }

  const handleCancel2FA = () => {
    setRequires2FA(false)
    setTwoFactorUserId(null)
    setTotpCode('')
    setPassword('')
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent/5 p-4 relative overflow-hidden">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-accent">Verificando sessão...</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-accent/5 p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        <Card className="shadow-2xl border-primary/10 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-5 text-center pt-8">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-3 border shadow-md ring-4 ring-primary/5">
              <img
                src="https://img.usecurling.com/i?q=company&shape=fill&color=blue"
                alt="Grupo Flávio Moura"
                className="h-full object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold text-accent tracking-tight">
                Hub de Gestão
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Insira suas credenciais de administrador para acessar o painel.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-8">
            {requires2FA ? (
              <form
                onSubmit={handleVerify2FA}
                className="space-y-5 animate-in fade-in slide-in-from-right-4"
              >
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                  <div className="text-xs text-left">
                    <p className="font-semibold text-foreground">Conta protegida por 2FA</p>
                    <p className="text-muted-foreground mt-0.5">
                      Abra seu aplicativo autenticador (Google Authenticator, Authy etc.) e digite o
                      código atual.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-accent/80 flex items-center gap-1.5"
                    htmlFor="totp-code"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Código de 6 Dígitos
                  </label>
                  <Input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="focus-visible:ring-primary h-12 text-center font-mono text-xl tracking-[0.4em] font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    type="submit"
                    disabled={isVerifying2FA || totpCode.length !== 6}
                    className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    {isVerifying2FA ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 mr-2" />
                    )}
                    Validar e Entrar
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel2FA}
                    disabled={isVerifying2FA}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar para o login
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2 text-left">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-accent/80"
                    htmlFor="username"
                  >
                    Usuário / E-mail
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="focus-visible:ring-primary h-11"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-accent/80"
                    htmlFor="password"
                  >
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="focus-visible:ring-primary h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading || authLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Entrar no Sistema
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground">
          <Button
            variant="link"
            onClick={() => navigate('/agendar')}
            className="text-muted-foreground hover:text-primary text-xs h-auto p-0"
          >
            Página pública de agendamento <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <span className="hidden sm:inline">•</span>
          <Button
            variant="link"
            onClick={() => navigate('/privacidade')}
            className="text-muted-foreground hover:text-primary text-xs h-auto p-0"
          >
            Política de Privacidade & LGPD
          </Button>
        </div>
      </div>
    </div>
  )
}
