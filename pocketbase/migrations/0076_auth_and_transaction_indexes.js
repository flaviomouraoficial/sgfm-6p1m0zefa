migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'flavio@trendconsultoria.com.br')
      record.setPassword('Skip@Pass')
      record.set('role', 'admin')
      record.setVerified(true)
      app.saveNoValidate(record)
    } catch (_) {
      const users = app.findCollectionByNameOrId('users')
      const record = new Record(users)
      record.setEmail('flavio@trendconsultoria.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Flávio Moura')
      record.set('role', 'admin')
      app.saveNoValidate(record)
    }

    const col = app.findCollectionByNameOrId('v1_transactions')
    col.addIndex('idx_transactions_created', false, 'created', '')
    col.addIndex('idx_transactions_type', false, 'type', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')
    col.removeIndex('idx_transactions_created')
    col.removeIndex('idx_transactions_type')
    app.save(col)
  },
)
