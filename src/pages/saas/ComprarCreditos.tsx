import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Check, CreditCard } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

export default function ComprarCreditos() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number>(user?.balance || 0)
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setBalance(user?.balance || 0)
  }, [user?.balance])

  useEffect(() => {
    fetchPackages()
  }, [])

  useRealtime(
    'users',
    (e) => {
      if (e.record.id === user?.id) {
        setBalance(e.record.balance || 0)
      }
    },
    !!user?.id,
  )

  const fetchPackages = async () => {
    try {
      const records = await pb.collection('v1_saas_credit_packages').getFullList({
        filter: 'active=true',
        sort: 'price',
      })
      setPackages(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (pkg: any) => {
    setProcessingId(pkg.id)
    try {
      // Create purchase intent via hook
      const res = await pb.send('/backend/v1/saas/buy-process', {
        method: 'POST',
        body: JSON.stringify({ package_id: pkg.id }),
      })
      if (res.payment_url) {
        toast({ title: 'Redirecionando...', description: 'Aguarde um momento.' })
        if (res.payment_url.includes('/dashboard')) {
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1500)
        } else {
          window.location.href = res.payment_url
        }
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível iniciar o pagamento.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando pacotes...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Comprar Créditos</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Adquira créditos de forma rápida e segura via Mercado Pago para continuar realizando os
          diagnósticos.
        </p>
        {user && (
          <div className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-primary/10 text-primary rounded-full font-semibold">
            Saldo Atual: {balance} créditos
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 pt-8">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className="relative flex flex-col hover:border-primary/50 transition-colors shadow-sm"
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <CardDescription className="pt-1.5 min-h-[40px]">
                {pkg.description || 'Pacote de créditos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6 pb-6">
              <div className="text-center">
                <span className="text-5xl font-black text-primary">{pkg.credits}</span>
                <span className="text-muted-foreground ml-2 font-medium">créditos</span>
              </div>
              <div className="text-3xl font-bold text-slate-700">
                R$ {pkg.price.toFixed(2).replace('.', ',')}
              </div>
              <ul className="space-y-2 w-full text-sm text-slate-600">
                <li className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-green-500" /> Liberação imediata
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-green-500" /> Sem validade (não expira)
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full h-12 text-base font-semibold"
                size="lg"
                onClick={() => handleBuy(pkg)}
                disabled={processingId === pkg.id}
              >
                {processingId === pkg.id ? (
                  'Processando...'
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" /> Comprar via Mercado Pago
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
