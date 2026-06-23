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
import { Check, CreditCard, Clock, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'

export default function ClientStore() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number>(user?.balance || 0)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const records = await pb.collection('v1_saas_settings').getList(1, 1)
        if (records.items.length > 0) setSettings(records.items[0])
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    }
    loadSettings()
  }, [])
  const [packages, setPackages] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setBalance(user?.balance || 0)
  }, [user?.balance])

  useEffect(() => {
    fetchPackages()
    if (user?.id) {
      fetchPurchases()
    }
  }, [user?.id])

  useRealtime(
    'v1_saas_credit_purchases',
    (e) => {
      if (e.record.client === user?.id) {
        fetchPurchases()
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

  const fetchPurchases = async () => {
    try {
      const records = await pb.collection('v1_saas_credit_purchases').getFullList({
        filter: `client="${user?.id}"`,
        sort: '-created',
        expand: 'package',
      })
      setPurchases(records)
    } catch (err) {
      console.error(err)
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

  const handleDownloadReceipt = (purchase: any) => {
    const pkg = purchase.expand?.package || {}
    const companyName = settings?.company_name || 'Empresa'
    const companyEmail = settings?.contact_email || ''
    const companyPhone = settings?.contact_phone || ''

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Por favor, permita pop-ups para gerar o recibo.',
        variant: 'destructive',
      })
      return
    }

    const dateStr = new Date(purchase.created).toLocaleDateString('pt-BR')
    const fileName = `receipt-${purchase.id}-${dateStr.replace(/\//g, '-')}`

    const html = `
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111827; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 32px; }
            .header h1 { color: #1e3a8a; margin: 0 0 8px 0; font-size: 24px; }
            .header p { margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5; }
            .title h2 { margin: 0 0 8px 0; font-size: 20px; color: #111827; }
            .title p { margin: 0; color: #6b7280; font-size: 14px; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
            .label { font-weight: 600; color: #374151; }
            .value { color: #111827; }
            .total { font-size: 18px; font-weight: 700; color: #1e3a8a; margin-top: 24px; text-align: right; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${companyName}</h1>
              <p>${companyEmail}<br/>${companyPhone}</p>
            </div>
            <div class="title" style="text-align: right;">
              <h2>Recibo de Compra</h2>
              <p>Transação #${purchase.id}</p>
              <p>Data: ${dateStr}</p>
            </div>
          </div>
          
          <div class="content">
            <div class="row">
              <span class="label">Cliente</span>
              <span class="value">${user?.name || user?.email}</span>
            </div>
            <div class="row">
              <span class="label">Pacote Adquirido</span>
              <span class="value">${pkg.name || 'Pacote Removido'}</span>
            </div>
            <div class="row">
              <span class="label">Créditos Recebidos</span>
              <span class="value">${purchase.credits} créditos</span>
            </div>
            <div class="row">
              <span class="label">Status</span>
              <span class="value">Pagamento Concluído</span>
            </div>
            
            <div class="total">
              Valor Total Pago: R$ ${purchase.price_paid?.toFixed(2).replace('.', ',')}
            </div>
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Pendente
          </Badge>
        )
      case 'concluido':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Concluído
          </Badge>
        )
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const supportPurchases = purchases.filter(
    (p) => p.status === 'pendente' || p.status === 'cancelado',
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up p-4">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Meus Créditos</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Adquira e gerencie seus créditos para continuar realizando os diagnósticos.
        </p>
        {user && (
          <div className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-primary/10 text-primary rounded-full font-semibold">
            Saldo Atual: {balance} créditos
          </div>
        )}
      </div>

      <Tabs defaultValue="comprar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-12">
          <TabsTrigger value="comprar" className="h-10">
            Comprar
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="h-10">
            Meus Pedidos
          </TabsTrigger>
          <TabsTrigger value="suporte" className="h-10">
            Suporte a Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comprar" className="mt-8">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando pacotes...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
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
          )}
        </TabsContent>

        <TabsContent value="pedidos" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pedidos</CardTitle>
              <CardDescription>Acompanhe todas as suas compras de créditos.</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido encontrado.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Pacote</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Valor Pago</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{formatDate(p.created)}</TableCell>
                          <TableCell>{p.expand?.package?.name || 'Pacote Removido'}</TableCell>
                          <TableCell>{p.credits}</TableCell>
                          <TableCell>R$ {p.price_paid?.toFixed(2).replace('.', ',')}</TableCell>
                          <TableCell>{getStatusBadge(p.status)}</TableCell>
                          <TableCell className="text-right">
                            {p.status === 'concluido' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReceipt(p)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Recibo
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suporte" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Suporte a Pagamentos</CardTitle>
              <CardDescription>
                Acompanhe pedidos pendentes ou problemas no pagamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportPurchases.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900">Tudo certo por aqui!</h3>
                  <p className="text-muted-foreground">
                    Você não possui pedidos pendentes ou cancelados no momento.
                  </p>
                </div>
              ) : (
                supportPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {p.expand?.package?.name || 'Pacote'}
                        </span>
                        {getStatusBadge(p.status)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatDate(p.created)} &bull; ID: {p.id}
                      </div>
                      {p.status === 'pendente' && (
                        <p className="text-sm text-blue-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Aguardando confirmação do Mercado Pago. Isso pode levar alguns minutos.
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <a
                        href={`mailto:suporte@exemplo.com?subject=Suporte Pedido ID: ${p.id}&body=Olá, preciso de ajuda com o pedido ID: ${p.id} (Status: ${p.status}).`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="outline" className="w-full md:w-auto">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Contatar Suporte
                        </Button>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
