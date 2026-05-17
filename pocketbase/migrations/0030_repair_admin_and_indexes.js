migrate(
  (app) => {
    // 1. Ensure admin user has correct password and role
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

    // 2. Ensure indexes are created safely without crashing
    app
      .db()
      .newQuery('CREATE INDEX IF NOT EXISTS idx_time_slots_date_0030 ON v1_time_slots (date)')
      .execute()
    app
      .db()
      .newQuery(
        'CREATE INDEX IF NOT EXISTS idx_time_slots_isBooked_0030 ON v1_time_slots (isBooked)',
      )
      .execute()
    app
      .db()
      .newQuery(
        'CREATE INDEX IF NOT EXISTS idx_agendamentos_data_0030 ON v1_agendamentos (data_horario)',
      )
      .execute()
  },
  (app) => {
    app.db().newQuery('DROP INDEX IF EXISTS idx_time_slots_date_0030').execute()
    app.db().newQuery('DROP INDEX IF EXISTS idx_time_slots_isBooked_0030').execute()
    app.db().newQuery('DROP INDEX IF EXISTS idx_agendamentos_data_0030').execute()
  },
)
