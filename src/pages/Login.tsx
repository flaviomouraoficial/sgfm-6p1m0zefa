import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Briefcase } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@flaviomoura.com.br')
  const [password, setPassword] = useState('admin123')
  const { loginAdmin } = useMainStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    const success = loginAdmin(email, password)
    if (success) {
      toast({ title: 'Acesso Administrativo', description: 'Login realizado com sucesso!' })
      navigate(from, { replace: true })
    } else {
      toast({
        title: 'Acesso Negado',
        description: 'Credenciais de administrador inválidas.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-14 h-14 bg-accent text-accent-foreground rounded-xl flex items-center justify-center mb-4 shadow-sm">
          <Briefcase className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sistema de Gestão</h1>
        <p className="text-sm text-muted-foreground mt-1">Acesso Administrativo (Mentor)</p>
      </div>

      <Card className="w-full max-w-sm shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>Insira suas credenciais para acessar o painel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@flaviomoura.com.br"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-2"
            >
              Entrar no Sistema
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-xs text-muted-foreground text-center space-y-1">
        <p>&copy; {new Date().getFullYear()} Flávio Moura. Todos os direitos reservados.</p>
        <p className="opacity-70 font-medium">(Dica: admin@flaviomoura.com.br / admin123)</p>
      </div>
    </div>
  )
}
