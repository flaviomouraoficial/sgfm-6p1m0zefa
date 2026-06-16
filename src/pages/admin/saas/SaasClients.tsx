import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function SaasClients() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Clientes SaaS</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
