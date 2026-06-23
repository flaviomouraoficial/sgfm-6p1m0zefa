onRecordAfterCreateSuccess((e) => {
  const email = e.record.email()
  if (!email) return e.next()

  let user = null
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    // User does not exist, nothing to sync yet
    return e.next()
  }

  let updated = false
  if (user.getString('role') !== 'client' && user.getString('role') !== 'admin') {
    user.set('role', 'client')
    updated = true
  }

  const perms = user.get('permissions') || {}
  if (!perms.saas_access || !perms.buy_credits) {
    user.set('permissions', {
      ...perms,
      saas_access: true,
      buy_credits: true,
    })
    updated = true
  }

  if (updated) {
    $app.save(user)
  }

  return e.next()
}, 'v1_clientes')
