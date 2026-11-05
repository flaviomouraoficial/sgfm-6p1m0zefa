// Fechamento mensal automático — dia 1º de cada mês (00:00 UTC).
// Consolida as transações do mês anterior, no total e POR EMPRESA (multi-CNPJ),
// gravando em v1_reports: month, totalRevenue, totalExpenses, netBalance e
// data (JSON com byCategory, transactionCount e por_empresa).
cronAdd('monthly_closing', '0 0 1 * *', () => {
  const now = new Date()
  let y = now.getFullYear()
  let m = now.getMonth()
  if (m === 0) {
    m = 12
    y--
  }
  const month = `${y}-${String(m).padStart(2, '0')}`

  const startStr = month + '-01 00:00:00.000Z'
  const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01 00:00:00.000Z`

  const txs = $app.findRecordsByFilter(
    'v1_transactions',
    `date >= '${startStr}' && date < '${endStr}'`,
    '',
    10000,
    0,
  )

  let totalRevenue = 0
  let totalExpenses = 0
  const byCategory = {}
  const porEmpresa = {}

  const grupoDe = (empId) => {
    if (!porEmpresa[empId]) {
      porEmpresa[empId] = {
        nome: '',
        totalRevenue: 0,
        totalExpenses: 0,
        netBalance: 0,
        byCategory: {},
        transactionCount: 0,
      }
    }
    return porEmpresa[empId]
  }

  txs.forEach((t) => {
    const amt = t.get('amount') || 0
    const type = t.getString('type')
    // 'Recibo' foi unificado em 'Recibos' no catálogo — normaliza para o relatório
    const rawCat = t.getString('category') || 'Outros'
    const cat = rawCat === 'Recibo' ? 'Recibos' : rawCat
    const isReceita = type === 'Receita' || type === 'Crédito'
    const empId = t.getString('empresa_id') || 'sem_empresa'

    const g = grupoDe(empId)
    if (!g.nome) {
      if (empId === 'sem_empresa') {
        g.nome = 'Sem empresa'
      } else {
        try {
          g.nome = $app.findRecordById('v1_empresas', empId).get('nome') || empId
        } catch (_) {
          g.nome = empId
        }
      }
    }

    if (isReceita) {
      totalRevenue += amt
      g.totalRevenue += amt
    } else {
      totalExpenses += amt
      g.totalExpenses += amt
    }
    g.netBalance = g.totalRevenue - g.totalExpenses
    g.transactionCount++

    if (!byCategory[cat]) byCategory[cat] = 0
    byCategory[cat] += amt
    if (!g.byCategory[cat]) g.byCategory[cat] = 0
    g.byCategory[cat] += amt
  })

  const netBalance = totalRevenue - totalExpenses

  let record
  try {
    record = $app.findFirstRecordByData('v1_reports', 'month', month)
  } catch (_) {
    const collection = $app.findCollectionByNameOrId('v1_reports')
    record = new Record(collection)
    record.set('month', month)
  }

  record.set('totalRevenue', totalRevenue)
  record.set('totalExpenses', totalExpenses)
  record.set('netBalance', netBalance)
  record.set(
    'data',
    JSON.stringify({ byCategory, transactionCount: txs.length, por_empresa: porEmpresa }),
  )

  $app.save(record)

  console.log(
    `monthly_closing: mês ${month} | receitas ${totalRevenue.toFixed(2)} | despesas ${totalExpenses.toFixed(2)} | saldo ${netBalance.toFixed(2)} | transações ${txs.length} | empresas ${Object.keys(porEmpresa).length}`,
  )
})
