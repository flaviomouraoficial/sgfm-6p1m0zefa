migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('flavio@trendconsultoria.com.br')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Flávio Moura')
    record.set('role', 'admin')
    record.set('plan', 'vip')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
