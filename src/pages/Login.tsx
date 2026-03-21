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
    // Simulate login
    login({ id: '1', name: 'Flávio Moura', email })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-24 w-full items-center justify-center rounded-lg bg-white p-4 border border-border/50 shadow-sm">
            <img src={logoUrl} alt="Grupo Flávio Moura" className="h-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-accent">Acesso Restrito</CardTitle>
          <CardDescription>Insira suas credenciais para acessar o hub de gestão.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-accent" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@grupoflaviomoura.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-accent" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-secondary text-primary-foreground"
            >
              Entrar no Sistema
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
