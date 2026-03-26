import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import logoUrl from '../assets/logo-21a08.jpg'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, ArrowRight } from 'lucide-react'

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Default redirect is /admin for dashboard
  const from =
    location.state?.from?.pathname === '/login'
      ? '/admin'
      : location.state?.from?.pathname || '/admin'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

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

    // For legacy fallback: if user typed "admin", try to log in with default email
    let email = username
    let finalPassword = password

    if (username === 'admin' || username === 'admin@grupoflaviomoura.com.br') {
      email = 'admin@grupoflaviomoura.com.br'
      if (password === 'admin') {
        finalPassword = 'admin1234'
      }
    }

    const { error } = await signIn(email, finalPassword)

    if (error) {
      toast({
        title: 'Acesso Negado',
        description: 'Credenciais inválidas. Verifique seu usuário e senha.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Acesso Liberado',
        description: 'Bem-vindo ao sistema!',
      })
      navigate(from, { replace: true })
    }

    setIsLoading(false)
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
              <img src={logoUrl} alt="Grupo Flávio Moura" className="h-full object-contain" />
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                disabled={isLoading}
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Entrar no Sistema
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate('/agendar')}
            className="text-muted-foreground hover:text-primary"
          >
            Acessar página pública de agendamento <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
