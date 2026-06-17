onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('role') !== 'client') return e.next()
  const email = e.record.email()
  if (!email) return e.next()

  let cliente = null
  try {
    cliente = $app.findFirstRecordByData('v1_clientes', 'email', email)
  } catch (_) {
    // Not found
  }

  if (!cliente) {
    const col = $app.findCollectionByNameOrId('v1_clientes')
    cliente = new Record(col)
    cliente.set('name', e.record.getString('name') || email)
    cliente.set('email', email)
    cliente.set('status', 'Ativo')
    $app.save(cliente)
  }

  return e.next()
}, 'users')
