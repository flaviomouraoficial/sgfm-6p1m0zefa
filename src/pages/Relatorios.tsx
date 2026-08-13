import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Printer, Filter, DollarSign, Users, CalendarDays, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { TREND_LOGO_URL } from '@/lib/trendPdf'

export default function Relatorios() {
  const [tab, setTab] = useState('financeiro')
  const [loading, setLoading] = useState(false)

  const [transactions, setTransactions] = useState<any[]>([])
  const [mentees, setMentees] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])

  const [finMonth, setFinMonth] = useState('all')
  const [menteeStatus, setMenteeStatus] = useState('all')
  const [sessionMonth, setSessionMonth] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [trans, ments, sess] = await Promise.all([
        pb.collection('v1_transactions').getFullList({ sort: '-date' }),
        pb.collection('v1_mentees').getFullList({ sort: '-created' }),
        pb.collection('v1_sessoes').getFullList({ sort: '-date', expand: 'mentee_id' }),
      ])
      setTransactions(trans)
      setMentees(ments)
      setSessions(sess)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePrint = () => window.print()

  // CSS de impressão: moldura de 12mm e logotipo fixo da Trend no canto superior esquerdo
  const printFrameStyle = `
    @media print {
      @page { size: A4; margin: 12mm; }
      body { position: relative; }
      .trend-corner-logo-print {
        position: fixed;
        top: 2mm;
        left: 2mm;
        height: 12mm;
        width: auto;
        max-width: 40mm;
        object-fit: contain;
        z-index: 9999;
        display: block !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `

  const filteredTransactions = transactions.filter((t) => {
    if (finMonth === 'all') return true
    if (!t.date) return false
    return t.date.substring(5, 7) === finMonth
  })

  const filteredMentees = mentees.filter((m) => {
    if (menteeStatus === 'all') return true
    return m.status === menteeStatus
  })

  const filteredSessions = sessions.filter((s) => {
    if (sessionMonth === 'all') return true
    if (!s.date) return false
    return s.date.substring(5, 7) === sessionMonth
  })

  const totalRevenue = filteredTransactions
    .filter((t) => t.type === 'Receita')
    .reduce((acc, t) => acc + (t.amount || 0), 0)
  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'Despesa')
    .reduce((acc, t) => acc + (t.amount || 0), 0)

  return (
    <div className="space-y-6">
      <style>{printFrameStyle}</style>
      <img
        src={TREND_LOGO_URL}
        alt="Trend Consultoria"
        className="hidden print:block trend-corner-logo-print"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">Relatórios e Exportação</h1>
          <p className="text-muted-foreground mt-1">
            Gere e exporte relatórios consolidados em PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="print:hidden mb-6 grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="financeiro">
            <DollarSign className="w-4 h-4 mr-2" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="mentorados">
            <Users className="w-4 h-4 mr-2" /> Mentorados
          </TabsTrigger>
          <TabsTrigger value="sessoes">
            <CalendarDays className="w-4 h-4 mr-2" /> Sessões
          </TabsTrigger>
        </TabsList>

        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Relatório Consolidado -{' '}
            {tab === 'financeiro' ? 'Financeiro' : tab === 'mentorados' ? 'Mentorados' : 'Sessões'}
          </h1>
          <p className="text-gray-500">Data de emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          <hr className="mt-4 border-black" />
        </div>

        <TabsContent value="financeiro" className="space-y-6">
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="print:hidden">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transações Financeiras</CardTitle>
                  <CardDescription>Resumo de receitas e despesas</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={finMonth} onValueChange={setFinMonth}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Meses</SelectItem>
                      <SelectItem value="01">Janeiro</SelectItem>
                      <SelectItem value="02">Fevereiro</SelectItem>
                      <SelectItem value="03">Março</SelectItem>
                      <SelectItem value="04">Abril</SelectItem>
                      <SelectItem value="05">Maio</SelectItem>
                      <SelectItem value="06">Junho</SelectItem>
                      <SelectItem value="07">Julho</SelectItem>
                      <SelectItem value="08">Agosto</SelectItem>
                      <SelectItem value="09">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg bg-green-50 print:bg-transparent">
                  <p className="text-sm font-medium text-green-800">Total Receitas</p>
                  <p className="text-2xl font-bold text-green-900">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-red-50 print:bg-transparent">
                  <p className="text-sm font-medium text-red-800">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-900">R$ {totalExpenses.toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50 print:bg-transparent">
                  <p className="text-sm font-medium text-blue-800">Saldo Líquido</p>
                  <p className="text-2xl font-bold text-blue-900">
                    R$ {(totalRevenue - totalExpenses).toFixed(2)}
                  </p>
                </div>
              </div>
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhuma transação encontrada para os filtros aplicados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 print:bg-transparent print:border-b-2 print:border-black">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="print:border-b print:border-gray-200">
                          <td className="px-4 py-3">
                            {t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium">{t.description}</td>
                          <td className="px-4 py-3">{t.category || '-'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={t.type === 'Receita' ? 'text-green-600' : 'text-red-600'}
                            >
                              {t.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            R$ {t.amount?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentorados" className="space-y-6">
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="print:hidden">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Relatório de Mentorados</CardTitle>
                  <CardDescription>Acompanhamento da base de clientes</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={menteeStatus} onValueChange={setMenteeStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Ativo">Ativos</SelectItem>
                      <SelectItem value="Inativo">Inativos</SelectItem>
                      <SelectItem value="Concluído">Concluídos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMentees.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhum mentorado encontrado para os filtros aplicados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 print:bg-transparent print:border-b-2 print:border-black">
                      <tr>
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Empresa</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Valor Contrato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredMentees.map((m) => (
                        <tr key={m.id} className="print:border-b print:border-gray-200">
                          <td className="px-4 py-3 font-medium">{m.name}</td>
                          <td className="px-4 py-3">{m.email}</td>
                          <td className="px-4 py-3">{m.company || '-'}</td>
                          <td className="px-4 py-3">{m.status || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            R$ {m.contractValue?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessoes" className="space-y-6">
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="print:hidden">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Histórico de Sessões</CardTitle>
                  <CardDescription>Sessões realizadas e agendadas</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={sessionMonth} onValueChange={setSessionMonth}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Meses</SelectItem>
                      <SelectItem value="01">Janeiro</SelectItem>
                      <SelectItem value="02">Fevereiro</SelectItem>
                      <SelectItem value="03">Março</SelectItem>
                      <SelectItem value="04">Abril</SelectItem>
                      <SelectItem value="05">Maio</SelectItem>
                      <SelectItem value="06">Junho</SelectItem>
                      <SelectItem value="07">Julho</SelectItem>
                      <SelectItem value="08">Agosto</SelectItem>
                      <SelectItem value="09">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhuma sessão encontrada para os filtros aplicados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 print:bg-transparent print:border-b-2 print:border-black">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Mentorado</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Duração</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredSessions.map((s) => (
                        <tr key={s.id} className="print:border-b print:border-gray-200">
                          <td className="px-4 py-3">
                            {s.date ? format(parseISO(s.date), 'dd/MM/yyyy HH:mm') : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {s.expand?.mentee_id?.name || '-'}
                          </td>
                          <td className="px-4 py-3">{s.type || '-'}</td>
                          <td className="px-4 py-3">{s.status || '-'}</td>
                          <td className="px-4 py-3">{s.duration ? `${s.duration} min` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
