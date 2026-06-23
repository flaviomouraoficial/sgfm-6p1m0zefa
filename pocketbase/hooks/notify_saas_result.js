onRecordAfterUpdateSuccess((e) => {
  if (
    e.record.getString('status') === 'Concluído' &&
    e.record.original().getString('status') !== 'Concluído'
  ) {
    try {
      const notifCol = $app.findCollectionByNameOrId('v1_notifications')
      const notif = new Record(notifCol)
      notif.set('user_id', e.record.getString('client'))
      notif.set('title', 'Novo Relatório Disponível')
      notif.set(
        'message',
        'Seu relatório de diagnóstico foi concluído e já está disponível para visualização.',
      )
      notif.set('is_read', false)
      $app.save(notif)
    } catch (err) {
      $app.logger().error('Failed to create notification for result', 'error', err.message)
    }
  }
  return e.next()
}, 'v1_saas_results')
