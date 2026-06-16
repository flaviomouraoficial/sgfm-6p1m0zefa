import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function SaasSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configurações SaaS</h1>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Pacotes e Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
