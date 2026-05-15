routerAdd(
  'POST',
  '/backend/v1/reports/closing',
  (e) => {
    const body = e.requestInfo().body
    const month = body.month
    if (!month) return e.badRequestError('Month is required (YYYY-MM)')

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

    txs.forEach((t) => {
      const amt = t.get('amount') || 0
      const type = t.getString('type')
      const cat = t.getString('category') || 'Outros'

      if (type === 'Receita' || type === 'Crédito') {
        totalRevenue += amt
      } else {
        totalExpenses += amt
      }

      if (!byCategory[cat]) byCategory[cat] = 0
      byCategory[cat] += amt
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
    record.set('data', JSON.stringify({ byCategory, transactionCount: txs.length }))

    $app.save(record)

    return e.json(200, record)
  },
  $apis.requireAuth(),
)
