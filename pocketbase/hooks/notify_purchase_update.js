onRecordAfterUpdateSuccess((e) => {
  const currentStatus = e.record.getString('status')
  const originalStatus = e.record.original().getString('status')

  if (currentStatus !== originalStatus) {
    try {
      const notifCol = $app.findCollectionByNameOrId('v1_notifications')
      const notif = new Record(notifCol)
      notif.set('user_id', e.record.getString('client'))

      if (currentStatus === 'concluido') {
        notif.set('title', '🎉 Créditos Adicionados!')
        notif.set(
          'message',
          `Sua compra de ${e.record.getInt('credits')} créditos foi aprovada pelo administrador e já está disponível na sua conta.`,
        )
        notif.set('is_read', false)
        $app.save(notif)
      } else if (currentStatus === 'cancelado') {
        notif.set('title', '❌ Pedido de Créditos Recusado/Cancelado')
        notif.set(
          'message',
          `Seu pedido de compra #${e.record.id} (${e.record.getInt('credits')} créditos) foi recusado ou cancelado. Entre em contato com o suporte em caso de dúvidas.`,
        )
        notif.set('is_read', false)
        $app.save(notif)
      }
    } catch (err) {
      $app.logger().error('Failed to create notification for purchase update', 'error', err.message)
    }
  }
  return e.next()
}, 'v1_saas_credit_purchases')
