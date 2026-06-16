import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ClientStore() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Loja de Créditos</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pacotes Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
