import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function SaasSettings() {
  const [packages, setPackages] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setPackages(await pb.collection('v1_saas_credit_packages').getFullList({ sort: 'price' }))
      setDiagnostics(await pb.collection('v1_saas_diagnostics').getFullList({ sort: 'title' }))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updatePackage = async (id: string, field: string, value: any) => {
    try {
      await pb.collection('v1_saas_credit_packages').update(id, { [field]: value })
      toast({ title: 'Salvo' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const updateDiagnostic = async (id: string, field: string, value: any) => {
    try {
      await pb.collection('v1_saas_diagnostics').update(id, { [field]: value })
      toast({ title: 'Salvo' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações SaaS</h2>
        <p className="text-muted-foreground">
          Gerencie o custo dos diagnósticos e pacotes de créditos.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Custo dos Diagnósticos</CardTitle>
            <CardDescription>Defina quantos créditos cada avaliação consome.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {diagnostics.map((diag) => (
              <div
                key={diag.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold">{diag.title}</p>
                  <p className="text-sm text-muted-foreground">{diag.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-24 text-center"
                    defaultValue={diag.cost}
                    onBlur={(e) => updateDiagnostic(diag.id, 'cost', parseFloat(e.target.value))}
                  />
                  <span className="text-sm text-muted-foreground font-medium">créditos</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pacotes de Créditos</CardTitle>
            <CardDescription>Configure os valores dos pacotes na Loja.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="space-y-4 border-b pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">{pkg.name}</h4>
                  <Button
                    variant={pkg.active ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => updatePackage(pkg.id, 'active', !pkg.active)}
                  >
                    {pkg.active ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Créditos</Label>
                    <Input
                      type="number"
                      defaultValue={pkg.credits}
                      onBlur={(e) => updatePackage(pkg.id, 'credits', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      defaultValue={pkg.price}
                      onBlur={(e) => updatePackage(pkg.id, 'price', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
