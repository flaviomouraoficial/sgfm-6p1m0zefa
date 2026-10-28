migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const email = 'integracao@trendconsultoria.com.br'
    const password = 'Integra!2026#f7Sync'

    let record = null
    try {
      record = app.findAuthRecordByEmail('users', email)
    } catch (_) {
      record = new Record(users)
      record.setEmail(email)
      record.setVerified(true)
      record.set('name', 'Integração Diagnósticos')
    }

    record.setPassword(password)
    record.set('role', 'admin')
    app.saveNoValidate(record)
  },
  (app) => {
    try {
      const r = app.findAuthRecordByEmail('users', 'integracao@trendconsultoria.com.br')
      app.delete(r)
    } catch (_) {}
  },
)
