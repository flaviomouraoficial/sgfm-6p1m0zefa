onRecordAfterUpdateSuccess((e) => {
  const status = e.record.getString('status')
  const originalStatus = e.record.original().getString('status')

  if (status === 'Aceita' && originalStatus !== 'Aceita') {
    try {
      const txCol = $app.findCollectionByNameOrId('v1_transactions')
      const tx = new Record(txCol)
      tx.set('description', `Proposta Aceita: ${e.record.getString('title')}`)
      tx.set('amount', e.record.getFloat('value'))
      tx.set('type', 'Receita')
      tx.set('status', 'Pendente')
      tx.set('category', 'Propostas')
      tx.set('date', new Date().toISOString().substring(0, 10))
      $app.save(tx)
    } catch (err) {
      console.log('Failed to create transaction from proposal:', err.message)
    }
  }
  return e.next()
}, 'v1_proposals')
