import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DollarSign,
  Coins,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Gift,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'

export default function SaasCreditsAdmin() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false)
  const [bonusClient, setBonusClient] = useState('')
  const [bonusCredits, setBonusCredits] = useState('')
  const [bonusNotes, setBonusNotes] = useState('')
  const [clientsList, setClientsList] = useState<any[]>([])

  const fetchPurchases = async () => {
    try {
      const records = await pb.collection('v1_saas_credit_purchases').getFullList({
        sort: '-created',
        expand: 'client,package,granted_by',
      })
      setPurchases(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientsList = async () => {
    try {
      const records = await pb.collection('users').getFullList({
        filter: 'role = "client" || role = "mentee"',
        sort: 'name',
      })
      setClientsList(records)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      })
    }
  }

  const handleGrantBonus = async () => {
    if (!bonusClient) {
      toast({ title: 'Aviso', description: 'Selecione um cliente.', variant: 'destructive' })
      return
    }
    if (!bonusCredits || isNaN(Number(bonusCredits)) || Number(bonusCredits) <= 0) {
      toast({
        title: 'Aviso',
        description: 'Insira uma quantidade válida de créditos.',
        variant: 'destructive',
      })
      return
    }

    try {
      await pb.collection('v1_saas_credit_purchases').create({
        client: bonusClient,
        credits: Number(bonusCredits),
        price_paid: 0,
        status: 'concluido',
        notes: bonusNotes,
        granted_by: user?.id,
      })

      toast({ title: 'Sucesso', description: 'Créditos concedidos com sucesso!' })
      setIsBonusModalOpen(false)
      setBonusClient('')
      setBonusCredits('')
      setBonusNotes('')
      fetchPurchases()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao conceder bônus.', variant: 'destructive' })
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await pb.collection('v1_saas_credit_purchases').update(id, { status: 'concluido' })
      toast({
        title: 'Sucesso',
        description: 'Compra aprovada com sucesso. Os créditos foram adicionados.',
      })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao aprovar compra.', variant: 'destructive' })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await pb.collection('v1_saas_credit_purchases').update(id, { status: 'cancelado' })
      toast({ title: 'Sucesso', description: 'Compra cancelada.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao cancelar compra.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  useRealtime('v1_saas_credit_purchases', () => {
    fetchPurchases()
  })

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    years.add(new Date().getFullYear().toString())
    purchases.forEach((p) => {
      if (p.status === 'concluido') {
        years.add(new Date(p.created).getFullYear().toString())
      }
    })
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [purchases])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let totalRevenue = 0
    let totalCredits = 0
    let currentMonthRevenue = 0
    let previousMonthRevenue = 0
    let currentMonthCredits = 0
    let previousMonthCredits = 0

    purchases.forEach((p) => {
      if (p.status !== 'concluido') return

      const d = new Date(p.created)
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear
      const isPrevMonth =
        currentMonth === 0
          ? d.getMonth() === 11 && d.getFullYear() === currentYear - 1
          : d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear

      const rev = p.price_paid || 0
      const cred = p.credits || 0

      totalRevenue += rev
      totalCredits += cred

      if (isCurrentMonth) {
        currentMonthRevenue += rev
        currentMonthCredits += cred
      } else if (isPrevMonth) {
        previousMonthRevenue += rev
        previousMonthCredits += cred
      }
    })

    const revGrowth =
      previousMonthRevenue === 0
        ? currentMonthRevenue > 0
          ? 100
          : 0
        : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    const credGrowth =
      previousMonthCredits === 0
        ? currentMonthCredits > 0
          ? 100
          : 0
        : ((currentMonthCredits - previousMonthCredits) / previousMonthCredits) * 100

    return {
      totalRevenue,
      totalCredits,
      revGrowth,
      credGrowth,
    }
  }, [purchases])

  const chartData = useMemo(() => {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    const data = months.map((m) => ({ month: m, revenue: 0, credits: 0 }))

    purchases.forEach((p) => {
      if (p.status !== 'concluido') return

      const d = new Date(p.created)
      if (d.getFullYear().toString() === selectedYear) {
        const mIndex = d.getMonth()
        data[mIndex].revenue += p.price_paid || 0
        data[mIndex].credits += p.credits || 0
      }
    })

    return data
  }, [purchases, selectedYear])

  if (loading) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">Financeiro SaaS</h2>
          <p className="text-muted-foreground">
            Monitore o faturamento e volume de créditos vendidos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              fetchClientsList()
              setIsBonusModalOpen(true)
            }}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
          >
            <Gift className="w-4 h-4 mr-2" />
            Conceder Bônus
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {stats.revGrowth >= 0 ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +{stats.revGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" /> {stats.revGrowth.toFixed(1)}%
                </span>
              )}
              <span className="ml-1">em relação ao mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Créditos Vendidos</CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {stats.credGrowth >= 0 ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +{stats.credGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" /> {stats.credGrowth.toFixed(1)}%
                </span>
              )}
              <span className="ml-1">em relação ao mês anterior</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal ({selectedYear})</CardTitle>
            <CardDescription>Faturamento gerado por vendas de créditos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ revenue: { color: '#10b981' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(val) => `R$ ${val}`} width={80} />
                    <Tooltip
                      content={
                        <ChartTooltipContent formatter={(val) => formatCurrency(val as number)} />
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={[4, 4, 0, 0]}
                      name="Receita"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume de Créditos ({selectedYear})</CardTitle>
            <CardDescription>Total de créditos comercializados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{ credits: { color: '#3b82f6' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis width={40} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="credits"
                      stroke="var(--color-credits)"
                      strokeWidth={3}
                      name="Créditos"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Gerencie as compras e bônus de créditos dos seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pacote/Detalhes</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Créditos</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.created), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">
                        {p.expand?.client?.name ||
                          p.expand?.client?.email ||
                          'Usuário Desconhecido'}
                      </TableCell>
                      <TableCell>
                        {p.price_paid === 0 ? (
                          <div className="flex flex-col">
                            <span className="flex items-center text-amber-600 font-medium">
                              <Gift className="w-4 h-4 mr-1" /> Bônus Admin
                            </span>
                            {p.notes && (
                              <span
                                className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]"
                                title={p.notes}
                              >
                                {p.notes}
                              </span>
                            )}
                          </div>
                        ) : (
                          p.expand?.package?.name || 'Pacote Removido'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.price_paid || 0)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-primary">
                        +{p.credits}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            p.status === 'concluido'
                              ? 'default'
                              : p.status === 'cancelado'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className={
                            p.status === 'concluido' ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                          }
                        >
                          {p.status === 'concluido'
                            ? 'Concluído'
                            : p.status === 'cancelado'
                              ? 'Cancelado'
                              : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === 'pendente' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200"
                              onClick={() => handleApprove(p.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleReject(p.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Cancelar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isBonusModalOpen} onOpenChange={setIsBonusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder Bônus de Créditos</DialogTitle>
            <DialogDescription>
              Atribua créditos manualmente para um cliente ou mentorado. Esta ação será registrada
              com custo zero e atualizará o saldo imediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente / Mentorado</Label>
              <Select value={bonusClient} onValueChange={setBonusClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {clientsList.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name || client.email} ({client.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade de Créditos</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 50"
                value={bonusCredits}
                onChange={(e) => setBonusCredits(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo / Observações</Label>
              <Textarea
                placeholder="Descreva o motivo da concessão do bônus..."
                value={bonusNotes}
                onChange={(e) => setBonusNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBonusModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGrantBonus} disabled={!bonusClient || !bonusCredits}>
              Confirmar Concessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
