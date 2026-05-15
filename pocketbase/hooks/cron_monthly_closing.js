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

  txs.forEach((t) => {
    const amt = t.get('amount') || 0
    const type = t.getString('type')
    const cat = t.getString('category') || 'Outros'

    if (type === 'Receita' || type === 'Crédito') totalRevenue += amt
    else totalExpenses += amt

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
})
