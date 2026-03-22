import { Transaction } from '@/lib/types'

export type FinancialMetrics = {
  grossRevenue: number
  taxes: number
  netRevenue: number
  cpv: number
  grossProfit: number
  operatingExpenses: number
  ebitda: number
  depreciation: number
  financialResults: number
  netProfit: number
  operatingMargin: number
}

export function calculateMetrics(transactions: Transaction[]): FinancialMetrics {
  let grossRevenue = 0,
    taxes = 0,
    cpv = 0,
    operatingExpenses = 0,
    depreciation = 0,
    financialResults = 0

  for (const t of transactions) {
    const amount = t.amount || 0
    if (t.type === 'Receita') {
      const cat = (t.category || t.service || '').toLowerCase()
      if (cat.includes('imposto') || cat.includes('deduç')) taxes += amount
      else grossRevenue += amount
    } else {
      const cat = (t.category || t.service || '').toLowerCase()
      if (cat.includes('imposto')) taxes += amount
      else if (
        cat.includes('custo') ||
        cat.includes('cpv') ||
        cat.includes('comissã') ||
        cat.includes('comissa')
      )
        cpv += amount
      else if (cat.includes('depreciaç') || cat.includes('amortizaç')) depreciation += amount
      else if (cat.includes('taxa') || cat.includes('juro') || cat.includes('financeir'))
        financialResults += amount
      else operatingExpenses += amount
    }
  }

  const netRevenue = grossRevenue - taxes
  const grossProfit = netRevenue - cpv
  const ebitda = grossProfit - operatingExpenses
  const netProfit = ebitda - depreciation - financialResults
  const operatingMargin = netRevenue > 0 ? (ebitda / netRevenue) * 100 : 0

  return {
    grossRevenue,
    taxes,
    netRevenue,
    cpv,
    grossProfit,
    operatingExpenses,
    ebitda,
    depreciation,
    financialResults,
    netProfit,
    operatingMargin,
  }
}

export function getMonthlyTrends(transactions: Transaction[], months = 12) {
  const data = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const monthTxs = transactions.filter((t) => t.date.startsWith(monthStr))
    const metrics = calculateMetrics(monthTxs)

    const inflows = monthTxs.filter((t) => t.type === 'Receita').reduce((a, b) => a + b.amount, 0)
    const outflows = monthTxs.filter((t) => t.type === 'Despesa').reduce((a, b) => a + b.amount, 0)

    data.push({
      month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase(),
      ebitda: metrics.ebitda,
      inflows,
      outflows,
      netProfit: metrics.netProfit,
    })
  }
  return data
}
