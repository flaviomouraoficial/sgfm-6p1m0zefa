onRecordAfterCreateSuccess((e) => {
  if (e.record.getString('status') === 'concluido' && e.record.getFloat('price_paid') === 0) {
    try {
      const notifCol = $app.findCollectionByNameOrId('v1_notifications')
      const notif = new Record(notifCol)
      notif.set('user_id', e.record.getString('client'))
      notif.set('title', 'Créditos Bônus Recebidos!')
      notif.set(
        'message',
        `Você recebeu um bônus de ${e.record.getInt('credits')} créditos na sua conta.`,
      )
      notif.set('is_read', false)
      $app.save(notif)
    } catch (err) {
      $app.logger().error('Failed to create notification for bonus purchase', 'error', err.message)
    }
  }
  return e.next()
}, 'v1_saas_credit_purchases')
