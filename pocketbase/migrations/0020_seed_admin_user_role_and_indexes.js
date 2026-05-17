migrate(
  (app) => {
    // Update or create the admin user
    const users = app.findCollectionByNameOrId('users')
    try {
      const record = app.findAuthRecordByEmail('users', 'flavio@trendconsultoria.com.br')
      record.setPassword('Skip@2026')
      record.set('role', 'admin')
      app.save(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('flavio@trendconsultoria.com.br')
      record.setPassword('Skip@2026')
      record.setVerified(true)
      record.set('name', 'Flávio Moura')
      record.set('role', 'admin')
      app.save(record)
    }

    // Add indexes to v1_time_slots for performance
    app
      .db()
      .newQuery('CREATE INDEX IF NOT EXISTS idx_time_slots_date ON v1_time_slots (date)')
      .execute()
    app
      .db()
      .newQuery('CREATE INDEX IF NOT EXISTS idx_time_slots_isBooked ON v1_time_slots (isBooked)')
      .execute()

    // Add indexes to v1_agendamentos for performance
    app
      .db()
      .newQuery(
        'CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON v1_agendamentos (data_horario)',
      )
      .execute()
  },
  (app) => {
    // Safe down migration
    app.db().newQuery('DROP INDEX IF EXISTS idx_time_slots_date').execute()
    app.db().newQuery('DROP INDEX IF EXISTS idx_time_slots_isBooked').execute()
    app.db().newQuery('DROP INDEX IF EXISTS idx_agendamentos_data').execute()
  },
)
