import { useState } from 'react'
import { useAuthStore } from '@/stores/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import logoUrl from '../assets/logo-21a08.jpg'

export default function Login() {
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // Authenticate. App.tsx router will automatically navigate to / based on the state update.
    login({ id: '1', name: 'Flávio Moura', email })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-accent/5 p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-2xl border-primary/10 relative z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-5 text-center pt-8">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-3 border shadow-md ring-4 ring-primary/5">
            <img src={logoUrl} alt="Grupo Flávio Moura" className="h-full object-contain" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold text-accent tracking-tight">
              Hub de Gestão
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              Insira suas credenciais para acessar o painel integrado.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-wider text-accent/80"
                htmlFor="email"
              >
                Email de Acesso
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@grupoflaviomoura.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-primary h-11"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-bold uppercase tracking-wider text-accent/80"
                htmlFor="password"
              >
                Senha Segura
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
              className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Entrar no Sistema
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
