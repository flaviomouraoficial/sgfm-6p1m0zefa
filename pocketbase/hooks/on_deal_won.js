onRecordAfterUpdateSuccess((e) => {
  const stage = e.record.getString('stage')
  const originalStage = e.record.original().getString('stage')

  if (
    (stage === 'won' || stage === 'Ganho' || stage === 'ganho') &&
    originalStage !== 'won' &&
    originalStage !== 'Ganho' &&
    originalStage !== 'ganho'
  ) {
    const clientName = e.record.getString('clientName') || e.record.getString('title')
    const email = e.record.getString('email')
    const phone = e.record.getString('phone')
    const value = e.record.getFloat('value')

    let clientId = null
    try {
      if (email) {
        const client = $app.findFirstRecordByData('v1_clientes', 'email', email)
        clientId = client.id
      } else {
        throw new Error('Not found')
      }
    } catch (_) {
      try {
        const col = $app.findCollectionByNameOrId('v1_clientes')
        const client = new Record(col)
        client.set('name', clientName)
        client.set('email', email)
        client.set('phone', phone)
        client.set('status', 'active')
        $app.save(client)
        clientId = client.id
      } catch (err) {
        console.log('Failed to create client:', err.message)
      }
    }

    try {
      if (email) {
        $app.findFirstRecordByData('v1_mentees', 'email', email)
      } else {
        throw new Error('Not found')
      }
    } catch (_) {
      try {
        const mCol = $app.findCollectionByNameOrId('v1_mentees')
        const mentee = new Record(mCol)
        mentee.set('name', clientName)
        mentee.set('email', email)
        mentee.set('phone', phone)
        mentee.set('status', 'Ativo')
        mentee.set('contractValue', value)
        if (clientId) mentee.set('cliente_id', clientId)
        $app.save(mentee)
      } catch (err) {
        console.log('Failed to create mentee:', err.message)
      }
    }

    try {
      const txCol = $app.findCollectionByNameOrId('v1_transactions')
      const tx = new Record(txCol)
      tx.set('description', `Receita de Negócio Ganho: ${e.record.getString('title')}`)
      tx.set('amount', value)
      tx.set('type', 'Receita')
      tx.set('status', 'Pendente')
      tx.set('category', 'Vendas')
      tx.set('date', new Date().toISOString().substring(0, 10))
      if (clientId) tx.set('client_id', clientId)
      $app.save(tx)
    } catch (err) {
      console.log('Failed to create transaction:', err.message)
    }
  }
  return e.next()
}, 'v1_deals')
