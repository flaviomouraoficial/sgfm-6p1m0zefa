onRecordAfterUpdateSuccess((e) => {
  const status = e.record.getString('status')
  const originalStatus = e.record.original().getString('status')

  const acceptedStatuses = ['Aceita', 'accepted', 'approved']
  if (!acceptedStatuses.includes(status) || acceptedStatuses.includes(originalStatus)) {
    return e.next()
  }

  const proposalTitle = e.record.getString('title')
  const proposalValue = e.record.getFloat('value')
  const dealId = e.record.getString('deal_id')

  if (dealId) {
    try {
      const deal = $app.findRecordById('v1_deals', dealId)
      deal.set('stage', 'ganho')
      $app.save(deal)
    } catch (err) {
      console.log('Failed to update deal to won:', err.message)
    }
  }

  try {
    const txCol = $app.findCollectionByNameOrId('v1_transactions')
    const tx = new Record(txCol)
    tx.set('description', 'Proposta Aceita: ' + proposalTitle)
    tx.set('amount', proposalValue)
    tx.set('type', 'Receita')
    tx.set('status', 'Pendente')
    tx.set('category', 'Servicos')
    tx.set('date', new Date().toISOString().substring(0, 10))
    tx.set('proposta_id', e.record.id)
    $app.save(tx)
  } catch (err) {
    console.log('Failed to create transaction from proposal:', err.message)
  }

  return e.next()
}, 'v1_proposals')
