onRecordAfterUpdateSuccess((e) => {
  const recibo = e.record
  const newStatus = recibo.getString('status')
  const oldStatus = recibo.original().getString('status')

  if (newStatus === 'Aprovado') {
    let tx = null
    try {
      tx = $app.findFirstRecordByData('v1_transactions', 'recibo_id', recibo.id)
    } catch (_) {
      const txCol = $app.findCollectionByNameOrId('v1_transactions')
      tx = new Record(txCol)
    }

    tx.set(
      'description',
      `Recibo ${recibo.getString('numero')} - ${recibo.getString('cliente_nome')}`,
    )
    tx.set('amount', recibo.getFloat('nf_valor_total') || recibo.getFloat('subtotal') || 0)
    tx.set('type', recibo.getString('tipo') === 'Receber' ? 'Receita' : 'Despesa')
    if (!tx.getString('status')) {
      tx.set('status', 'Pendente')
    }
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
  } else if ((oldStatus === 'Aprovado' && newStatus !== 'Aprovado') || newStatus === 'Cancelado') {
    try {
      const tx = $app.findFirstRecordByData('v1_transactions', 'recibo_id', recibo.id)
      $app.delete(tx)
    } catch (_) {}
  }

  return e.next()
}, 'v1_recibos')
