onRecordCreate((e) => {
  if (!e.record.getString('role')) {
    e.record.set('role', 'client')
  }

  let perms = e.record.get('permissions')
  if (!perms) perms = {}

  if (Object.keys(perms).length === 0) {
    e.record.set('permissions', {
      saas_access: true,
      buy_credits: true,
    })
  }

  return e.next()
}, 'users')
