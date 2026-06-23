onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original()
  const current = e.record

  const oldPerms = original.get('permissions') || {}
  const newPerms = current.get('permissions') || {}

  const oldStr = JSON.stringify(oldPerms)
  const newStr = JSON.stringify(newPerms)

  if (oldStr !== newStr) {
    const logsCol = $app.findCollectionByNameOrId('v1_access_logs')
    const logRecord = new Record(logsCol)
    logRecord.set('target_user_id', current.id)

    let adminId = ''
    try {
      if (e.auth) adminId = e.auth.id
    } catch (_) {}

    if (adminId) {
      logRecord.set('admin_id', adminId)
    }

    logRecord.set('old_permissions', oldPerms)
    logRecord.set('new_permissions', newPerms)
    $app.saveNoValidate(logRecord)

    const notifCol = $app.findCollectionByNameOrId('v1_notifications')
    const notifRecord = new Record(notifCol)
    notifRecord.set('user_id', current.id)
    notifRecord.set('title', 'Acesso Atualizado')
    notifRecord.set('message', 'Seu acesso ao sistema foi atualizado por um administrador.')
    notifRecord.set('is_read', false)
    $app.saveNoValidate(notifRecord)
  }

  return e.next()
}, 'users')
