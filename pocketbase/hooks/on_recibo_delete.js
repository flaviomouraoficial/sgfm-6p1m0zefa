onRecordAfterDeleteSuccess((e) => {
  const recibo = e.record
  try {
    const tx = $app.findFirstRecordByData('v1_transactions', 'recibo_id', recibo.id)
    $app.delete(tx)
  } catch (_) {}
  return e.next()
}, 'v1_recibos')
