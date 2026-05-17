migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    try {
      const record = app.findAuthRecordByEmail('users', 'flavio@trendconsultoria.com.br')
      record.setPassword('Skip@2026')
      record.set('role', 'admin')
      record.setVerified(true)
      app.saveNoValidate(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('flavio@trendconsultoria.com.br')
      record.setPassword('Skip@2026')
      record.setVerified(true)
      record.set('name', 'Flávio Moura')
      record.set('role', 'admin')
      app.saveNoValidate(record)
    }
  },
  (app) => {},
)
