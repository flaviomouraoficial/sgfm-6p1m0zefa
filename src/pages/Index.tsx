import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { cloudApi } from '@/lib/cloudApi'
import { formatCurrency } from '@/lib/utils'
import { Client, Deal, Transaction } from '@/lib/types'

export default function Index() {
  const [stats, setStats] = useState({
    clients: 0,
    activeDeals: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const [clients, deals, transactions] = await Promise.all([
        cloudApi.clients.list(),
        cloudApi.deals.list(),
        cloudApi.transactions.list(),
      ])

      const now = new Date()
      const thisMonthTx = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })

      const income = thisMonthTx
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0)
      const expense = thisMonthTx
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0)

      setStats({
        clients: clients.filter((c) => c.status === 'active').length,
        activeDeals: deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length,
        monthlyIncome: income,
        monthlyExpense: expense,
      })
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent">Hub Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio Grupo Flávio Moura.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentorados Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios no Funil</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.activeDeals}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(stats.monthlyIncome)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(stats.monthlyExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future charts or lists */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              O painel de atividades está operando normalmente. Acesse os módulos no menu lateral
              para gerenciar os dados.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
