onRecordAfterCreateSuccess((e) => {
  const recibo = e.record
  if (recibo.getString('status') !== 'Aprovado') {
    return e.next()
  }

  try {
    const txCol = $app.findCollectionByNameOrId('v1_transactions')
    const amount = recibo.getFloat('nf_valor_total') || recibo.getFloat('subtotal') || 0
    const type = recibo.getString('tipo') === 'Receber' ? 'Receita' : 'Despesa'

    let matchingTx = null
    try {
      const records = $app.findRecordsByFilter(
        'v1_transactions',
        "amount = {:amount} && recibo_id = '' && type = {:type}",
        '-created',
        1,
        0,
        { amount, type },
      )
      if (records && records.length > 0) {
        matchingTx = records[0]
      }
    } catch (_) {}

    if (matchingTx) {
      matchingTx.set('recibo_id', recibo.id)
      $app.save(matchingTx)
    } else {
      const tx = new Record(txCol)
      tx.set(
        'description',
        `Recibo ${recibo.getString('numero')} - ${recibo.getString('cliente_nome')}`,
      )
      tx.set('amount', amount)
      tx.set('type', type)
      tx.set('status', 'Pendente')
      tx.set('category', 'Recibos')
      tx.set('date', recibo.getString('data_criacao'))
      tx.set('recibo_id', recibo.id)

      try {
        const cliente = $app.findFirstRecordByData(
          'v1_clientes',
          'name',
          recibo.getString('cliente_nome'),
        )
        tx.set('client_id', cliente.id)
      } catch (_) {}

      $app.save(tx)
    }
  } catch (err) {
    console.log('Erro ao vincular recibo com transação:', err.message)
  }

  return e.next()
}, 'v1_recibos')
