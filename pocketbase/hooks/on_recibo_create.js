onRecordAfterCreateSuccess((e) => {
  const recibo = e.record
  const tipo = recibo.getString('tipo')
  const amount = recibo.getFloat('nf_valor_total') || recibo.getFloat('subtotal') || 0
  const txType = tipo === 'Receber' ? 'Receita' : 'Despesa'
  const clienteNome = recibo.getString('cliente_nome')
  const dataCriacao = recibo.getString('data_criacao')

  let matchingTx = null

  try {
    const filterStr = 'amount = {:amount} && type = {:type}'
    const records = $app.findRecordsByFilter('v1_transactions', filterStr, '-created', 10, 0, {
      amount: amount,
      type: txType,
    })
    if (records && records.length > 0) {
      for (const tx of records) {
        const txDesc = tx.getString('description') || ''
        const txDate = tx.getString('date') || ''
        if (txDesc.indexOf(clienteNome) !== -1 || txDate === dataCriacao) {
          matchingTx = tx
          break
        }
      }
      if (!matchingTx) {
        matchingTx = records[0]
      }
    }
  } catch (_) {}

  if (matchingTx && !matchingTx.getString('recibo_id')) {
    try {
      matchingTx.set('recibo_id', recibo.id)
      $app.save(matchingTx)
    } catch (err) {
      console.log('Failed to link recibo to transaction:', err.message)
    }
  } else if (!matchingTx) {
    try {
      const txCol = $app.findCollectionByNameOrId('v1_transactions')
      const tx = new Record(txCol)
      tx.set('description', 'Recibo ' + recibo.getString('numero') + ' - ' + clienteNome)
      tx.set('amount', amount)
      tx.set('type', txType)
      tx.set('status', 'Pendente')
      tx.set('category', 'Recibos')
      tx.set('date', dataCriacao)
      tx.set('recibo_id', recibo.id)

      try {
        const cliente = $app.findFirstRecordByData('v1_clientes', 'name', clienteNome)
        tx.set('client_id', cliente.id)
      } catch (_) {}

      $app.save(tx)
    } catch (err) {
      console.log('Failed to create transaction from recibo:', err.message)
    }
  }

  return e.next()
}, 'v1_recibos')
