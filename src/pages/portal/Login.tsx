import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function PortalLogin() {
  const [email, setEmail] = useState('')
  const { loginMentee, menteeAuth } = useMainStore()
  const navigate = useNavigate()

  if (menteeAuth?.isAuthenticated) {
    return <Navigate to="/portal/dashboard" replace />
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    const success = loginMentee(email)
    if (success) {
      toast({ title: 'Login realizado com sucesso!' })
      navigate('/portal/dashboard')
    } else {
      toast({
        title: 'Acesso Negado',
        description: 'E-mail não encontrado na base de mentorados.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-4 shadow-sm">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Portal do Mentorado
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Acesso exclusivo</p>
      </div>

      <Card className="w-full max-w-sm shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center bg-muted/10 border-b">
          <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
          <CardDescription>Insira seu e-mail para acessar seus materiais e boletos</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Cadastrado</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
            >
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Grupo Flávio Moura. Todos os direitos reservados.
      </div>
    </div>
  )
}
