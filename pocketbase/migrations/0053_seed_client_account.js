migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'cliente@teste.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('cliente@teste.com')
    record.setPassword('Skip@Pass2025')
    record.setVerified(true)
    record.set('name', 'Cliente Teste')
    record.set('role', 'client')
    record.set('plan', 'básico')
    record.set('balance', 0)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'cliente@teste.com')
      app.delete(record)
    } catch (_) {}
  },
)
