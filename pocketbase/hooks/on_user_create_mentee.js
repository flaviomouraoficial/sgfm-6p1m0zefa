onRecordAfterCreateSuccess((e) => {
  const user = e.record
  if (user.getString('role') === 'mentee') {
    try {
      $app.findFirstRecordByData('v1_mentees', 'email', user.getString('email'))
    } catch (_) {
      const col = $app.findCollectionByNameOrId('v1_mentees')
      const mentee = new Record(col)
      mentee.set('name', user.getString('name') || user.getString('email').split('@')[0])
      mentee.set('email', user.getString('email'))
      mentee.set('status', 'Ativo')
      $app.save(mentee)
    }
  }
  e.next()
}, 'users')
