import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { FinancialDashboard } from '@/components/reports/FinancialDashboard'
import { DREReport } from '@/components/reports/DREReport'
import { CashFlowReport } from '@/components/reports/CashFlowReport'
import { GeneralReports } from '@/components/reports/GeneralReports'
import { calculateMetrics } from '@/lib/financial'

export default function Relatorios() {
  const { transactions, timeSlots, proposals, deals } = useMainStore()

  const [search, setSearch] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [status, setStatus] = useState('Todos')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const [activeGeneralTab, setActiveGeneralTab] = useState('financeiro')

  const filteredTxs = useMemo(
    () =>
      transactions
        .filter((t) => {
          if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
          if (start && t.date < start) return false
          if (end && t.date > end) return false
          if (status !== 'Todos' && t.status !== status) return false
          return true
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, search, start, end, status],
  )

  const filteredSlots = useMemo(
    () =>
      timeSlots
        .filter((t) => {
          if (search && !t.menteeName?.toLowerCase().includes(search.toLowerCase())) return false
          if (start && t.date < start) return false
          if (end && t.date > end) return false
          return true
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [timeSlots, search, start, end],
  )

  const filteredProps = useMemo(
    () =>
      proposals
        .filter((p) => {
          if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
          if (start && p.expirationDate < start) return false
          if (end && p.expirationDate > end) return false
          return true
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [proposals, search, start, end],
  )

  const metrics = useMemo(() => calculateMetrics(filteredTxs), [filteredTxs])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-accent">Relatórios de Inteligência</h1>
        <p className="text-muted-foreground mt-1">
          Análise financeira avançada, DRE, EBITDA e Cash Flow corporativo.
        </p>
      </div>

      <ReportFilters
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
      />

      <Tabs defaultValue="dashboard" className="w-full" onValueChange={() => setPage(1)}>
        <TabsList className="mb-4 flex-wrap h-auto shadow-sm">
          <TabsTrigger value="dashboard">Inteligência (KPIs)</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="general">Outros Registros</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FinancialDashboard metrics={metrics} allTransactions={transactions} />
        </TabsContent>

        <TabsContent value="dre">
          <DREReport metrics={metrics} />
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowReport transactions={filteredTxs} allTransactions={transactions} />
        </TabsContent>

        <TabsContent value="general">
          <Tabs value={activeGeneralTab} onValueChange={setActiveGeneralTab} className="w-full">
            <TabsList className="mb-4 bg-muted/50 border">
              <TabsTrigger value="financeiro">Transações</TabsTrigger>
              <TabsTrigger value="propostas">Propostas</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
            <GeneralReports
              activeTab={activeGeneralTab}
              pagedTxs={filteredTxs.slice((page - 1) * itemsPerPage, page * itemsPerPage)}
              pagedProps={filteredProps.slice((page - 1) * itemsPerPage, page * itemsPerPage)}
              pagedSlots={filteredSlots.slice((page - 1) * itemsPerPage, page * itemsPerPage)}
              deals={deals}
              filteredTxsLength={filteredTxs.length}
              filteredPropsLength={filteredProps.length}
              filteredSlotsLength={filteredSlots.length}
              page={page}
              setPage={setPage}
              itemsPerPage={itemsPerPage}
            />
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}
