import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Coins } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'

export default function Store() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const pkgs = await pb.collection('v1_saas_credit_packages').getFullList({
          filter: 'active = true',
          sort: 'price',
        })
        setPackages(pkgs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPackages()
  }, [])

  const handleBuy = async (pkg: any) => {
    setBuying(pkg.id)
    try {
      await pb.send('/backend/v1/saas/buy', {
        method: 'POST',
        body: JSON.stringify({ package_id: pkg.id }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast({
        title: 'Compra realizada!',
        description: `${pkg.credits} créditos foram adicionados à sua conta.`,
      })
      navigate('/dashboard')
    } catch (err: any) {
      toast({
        title: 'Erro na compra',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setBuying(null)
    }
  }

  if (loading) return <div className="p-8">Carregando loja...</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Loja de Créditos</h2>
        <p className="text-muted-foreground">
          Adquira créditos para realizar novos diagnósticos organizacionais.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className="flex flex-col relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50"
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center flex-1 py-6">
              <div className="flex justify-center items-end gap-1 mb-4">
                <span className="text-4xl font-extrabold">{formatCurrency(pkg.price)}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-primary font-medium bg-primary/10 py-2 rounded-full w-max mx-auto px-4">
                <Coins className="h-5 w-5" />
                {pkg.credits} Créditos
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleBuy(pkg)}
                disabled={buying === pkg.id}
              >
                {buying === pkg.id ? 'Processando...' : 'Comprar Agora'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
