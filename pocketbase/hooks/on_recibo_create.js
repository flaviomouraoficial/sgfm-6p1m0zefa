onRecordAfterCreateSuccess((e) => {
  const recibo = e.record
  if (recibo.getString('status') !== 'Aprovado') {
    return e.next()
  }

  const txCol = $app.findCollectionByNameOrId('v1_transactions')
  const tx = new Record(txCol)

  tx.set(
    'description',
    `Recibo ${recibo.getString('numero')} - ${recibo.getString('cliente_nome')}`,
  )
  tx.set('amount', recibo.getFloat('nf_valor_total') || recibo.getFloat('subtotal') || 0)
  tx.set('type', recibo.getString('tipo') === 'Receber' ? 'Receita' : 'Despesa')
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

  return e.next()
}, 'v1_recibos')
