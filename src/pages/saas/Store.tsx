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
import { Check, CreditCard, Clock, Coins, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Store() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [balance, setBalance] = useState<number>(0)
  const [packages, setPackages] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      if (!user?.id) return

      const [userData, packagesData, historyData] = await Promise.all([
        pb.collection('users').getOne(user.id),
        pb
          .collection('v1_saas_credit_packages')
          .getFullList({ filter: 'active=true', sort: 'price' }),
        pb.collection('v1_saas_credit_purchases').getFullList({
          filter: `client="${user.id}"`,
          sort: '-created',
          expand: 'package',
        }),
      ])

      setBalance(userData.balance || 0)
      setPackages(packagesData)
      setHistory(historyData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (pkg: any) => {
    setProcessingId(pkg.id)
    try {
      const res = await pb.send('/backend/v1/saas/buy-process', {
        method: 'POST',
        body: JSON.stringify({ package_id: pkg.id }),
      })
      if (res.payment_url) {
        toast({ title: 'Redirecionando...', description: 'Aguarde um momento.' })
        if (res.payment_url.includes('/dashboard')) {
          setTimeout(() => {
            window.location.href = res.payment_url
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
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Créditos</h1>
          <p className="text-slate-500 mt-1">
            Acompanhe seu saldo, adquira novos pacotes e veja seu histórico.
          </p>
        </div>
        <Card className="bg-primary text-primary-foreground border-none shadow-lg w-full md:w-auto">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider">
                Saldo Atual
              </p>
              <p className="text-3xl font-bold">
                {balance} <span className="text-lg font-normal">créditos</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className="relative flex flex-col hover:border-primary/50 transition-colors shadow-sm"
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription className="pt-1 min-h-[40px]">
                {pkg.description || 'Pacote de créditos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6 pb-6">
              <div className="text-center">
                <span className="text-4xl font-black text-primary">{pkg.credits}</span>
                <span className="text-muted-foreground ml-2 font-medium">créditos</span>
              </div>
              <div className="text-2xl font-bold text-slate-700">
                R$ {pkg.price.toFixed(2).replace('.', ',')}
              </div>
              <ul className="space-y-2 w-full text-sm text-slate-600">
                <li className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-green-500" /> Liberação imediata
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-green-500" /> Não expira
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full h-11 text-base font-semibold"
                onClick={() => handleBuy(pkg)}
                disabled={processingId === pkg.id}
              >
                {processingId === pkg.id ? (
                  'Processando...'
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" /> Comprar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-slate-500" /> Histórico de Compras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pacote</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Nenhuma compra realizada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      {format(new Date(h.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {h.expand?.package?.name || 'Pacote Removido'}
                    </TableCell>
                    <TableCell>+{h.credits}</TableCell>
                    <TableCell>R$ {(h.price_paid || 0).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                      {h.status === 'concluido' ? (
                        <Badge className="bg-emerald-500">Concluído</Badge>
                      ) : h.status === 'pendente' ? (
                        <Badge variant="secondary">Pendente</Badge>
                      ) : (
                        <Badge variant="destructive">Cancelado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
