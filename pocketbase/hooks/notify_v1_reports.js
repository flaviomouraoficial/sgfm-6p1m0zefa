onRecordAfterCreateSuccess((e) => {
  try {
    const notifCol = $app.findCollectionByNameOrId('v1_notifications')
    const admins = $app.findRecordsByFilter('users', "role = 'admin'", '', 100, 0)
    for (const admin of admins) {
      const notif = new Record(notifCol)
      notif.set('user_id', admin.id)
      notif.set('title', 'Novo Relatório Financeiro')
      notif.set('message', `O relatório de ${e.record.getString('month')} foi gerado.`)
      notif.set('is_read', false)
      $app.save(notif)
    }
  } catch (err) {
    $app.logger().error('Failed to create notification for v1_reports', 'error', err.message)
  }
  return e.next()
}, 'v1_reports')
