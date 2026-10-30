onRecordAfterCreateSuccess((e) => {
  // Disparar notificação para administradores quando um novo pedido com status 'pendente' for criado
  if (e.record.getString('status') === 'pendente') {
    const credits = e.record.getInt('credits')
    const price = e.record.getFloat('price_paid')
    const userId = e.record.getString('client')

    let userName = 'Cliente'
    try {
      const user = $app.findRecordById('users', userId)
      userName = user.getString('name') || user.getString('email') || 'Cliente'
    } catch (_) {}

    let targetAdmins = []
    try {
      targetAdmins = $app.findRecordsByFilter(
        'users',
        `role = 'admin' || permissions ~ 'buy_credits'`,
        '',
        20,
        0,
      )
    } catch (_) {}

    if (targetAdmins.length === 0) {
      try {
        targetAdmins = $app.findRecordsByFilter('users', `role = 'admin'`, '', 10, 0)
      } catch (_) {}
    }

    const notifCol = $app.findCollectionByNameOrId('v1_notifications')
    targetAdmins.forEach((admin) => {
      try {
        const notif = new Record(notifCol)
        notif.set('user_id', admin.id)
        notif.set('title', '💳 Novo Pedido de Créditos Aguardando Confirmação')
        notif.set(
          'message',
          `O cliente ${userName} realizou o pedido #${e.record.id} (${credits} créditos por R$ ${price.toFixed(2).replace('.', ',')}) via PIX e aguarda confirmação.`,
        )
        notif.set('is_read', false)
        $app.save(notif)
      } catch (err) {
        $app
          .logger()
          .error('on_purchase_created_notify: failed to notify admin', 'err', err.message)
      }
    })
  }

  return e.next()
}, 'v1_saas_credit_purchases')
