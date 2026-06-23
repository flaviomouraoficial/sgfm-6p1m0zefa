onRecordAfterUpdateSuccess((e) => {
  if (
    e.record.getString('status') === 'concluido' &&
    e.record.original().getString('status') !== 'concluido'
  ) {
    try {
      const notifCol = $app.findCollectionByNameOrId('v1_notifications')
      const notif = new Record(notifCol)
      notif.set('user_id', e.record.getString('client'))
      notif.set('title', 'Créditos Adicionados!')
      notif.set('message', `Sua compra de ${e.record.getInt('credits')} créditos foi aprovada.`)
      notif.set('is_read', false)
      $app.save(notif)
    } catch (err) {
      $app.logger().error('Failed to create notification for purchase', 'error', err.message)
    }
  }
  return e.next()
}, 'v1_saas_credit_purchases')
