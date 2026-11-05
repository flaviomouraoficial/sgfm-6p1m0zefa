// Fechamento manual — POST /backend/v1/reports/closing { month: "YYYY-MM" }
// Mesma lógica do cron monthly_closing: consolida o mês no total e POR EMPRESA
// (multi-CNPJ), gravando/atualizando o registro em v1_reports.
routerAdd(
  'POST',
  '/backend/v1/reports/closing',
  (e) => {
    const body = e.requestInfo().body
    const month = body.month
    if (!month) return e.badRequestError('Month is required (YYYY-MM)')
    if (!/^\d{4}-\d{2}$/.test(month)) return e.badRequestError('Formato inválido: use YYYY-MM')

    const startStr = month + '-01 00:00:00.000Z'
    let [y, m] = month.split('-')
    let ny = parseInt(y),
      nm = parseInt(m) + 1
    if (nm > 12) {
      nm = 1
      ny++
    }
    const endStr = `${ny}-${String(nm).padStart(2, '0')}-01 00:00:00.000Z`

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
      `manual_monthly_closing: mês ${month} | receitas ${totalRevenue.toFixed(2)} | despesas ${totalExpenses.toFixed(2)} | saldo ${netBalance.toFixed(2)} | transações ${txs.length} | empresas ${Object.keys(porEmpresa).length}`,
    )

    return e.json(200, record)
  },
  $apis.requireAuth(),
)
