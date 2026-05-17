migrate(
  (app) => {
    app
      .db()
      .newQuery('CREATE INDEX IF NOT EXISTS idx_time_slots_date_0020 ON v1_time_slots (date)')
      .execute()
    app
      .db()
      .newQuery(
        'CREATE INDEX IF NOT EXISTS idx_time_slots_isBooked_0020 ON v1_time_slots (isBooked)',
      )
      .execute()
    app
      .db()
      .newQuery(
        'CREATE INDEX IF NOT EXISTS idx_agendamentos_data_0020 ON v1_agendamentos (data_horario)',
      )
      .execute()
  },
  (app) => {
    app.db().newQuery('DROP INDEX IF EXISTS idx_time_slots_date_0020').execute()
    app.db().newQuery('DROP INDEX IF EXISTS idx_time_slots_isBooked_0020').execute()
    app.db().newQuery('DROP INDEX IF EXISTS idx_agendamentos_data_0020').execute()
  },
)
