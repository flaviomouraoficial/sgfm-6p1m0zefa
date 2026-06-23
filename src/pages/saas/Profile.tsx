import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { DollarSign, User, Mail, Shield, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Minha Conta</h2>
        <p className="text-muted-foreground">Gerencie seu perfil e suas permissões no sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Detalhes do Perfil
            </CardTitle>
            <CardDescription>Suas informações pessoais de acesso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-base font-semibold">{user?.name || 'Não informado'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">E-mail</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-base">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-1 pt-2">
              <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
              <Badge variant="secondary" className="uppercase text-xs mt-1">
                {user?.plan || 'Básico'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Acessos e Permissões
            </CardTitle>
            <CardDescription>Módulos que você tem acesso no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {user?.permissions?.saas_access && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Acesso à Plataforma SaaS</span>
                </div>
              )}
              {user?.permissions?.buy_credits && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Compra de Créditos</span>
                </div>
              )}
              {user?.permissions?.reports !== false && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Visualização de Resultados</span>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button asChild className="w-full">
                <Link to="/saas/credits">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Gerenciar Créditos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
