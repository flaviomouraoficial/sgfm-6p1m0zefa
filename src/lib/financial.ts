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
    const classification =
      t.classification || (t.type === 'Receita' ? 'Receita de Venda' : 'Despesa Operacional')

    const subcat = (t.category || t.service || '').toLowerCase()

    if (classification === 'Receita de Venda') {
      if (subcat.includes('imposto') || subcat.includes('deduç')) taxes += amount
      else grossRevenue += amount
    } else if (classification === 'Despesa Operacional') {
      if (subcat.includes('imposto')) taxes += amount
      else if (
        subcat.includes('custo') ||
        subcat.includes('cpv') ||
        subcat.includes('comissã') ||
        subcat.includes('comissa')
      )
        cpv += amount
      else if (subcat.includes('depreciaç') || subcat.includes('amortizaç')) depreciation += amount
      else if (
        subcat.includes('juro') ||
        subcat.includes('taxa') ||
        subcat.includes('financeir') ||
        subcat === 'juros/taxas'
      )
        financialResults += amount
      else operatingExpenses += amount
    } else if (classification === 'Investimento') {
      // Investments are excluded from DRE/EBITDA calculations.
      // They represent capital expenditures, while their long-term
      // operational impact is usually handled via Depreciation.
    }
  }

  const netRevenue = grossRevenue - taxes
  const grossProfit = netRevenue - cpv
  // EBITDA formally excludes Financial Results (Juros/Taxas), Depreciation, and Taxes
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
