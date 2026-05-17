migrate(
  (app) => {
    // Update or create the admin user
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')
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
    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')
    timeSlots.addIndex('idx_time_slots_date_0022', false, 'date', '')
    timeSlots.addIndex('idx_time_slots_isBooked_0022', false, 'isBooked', '')
    app.save(timeSlots)

    // Add indexes to v1_agendamentos for performance
    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.addIndex('idx_agendamentos_data_0022', false, 'data_horario', '')
    app.save(agendamentos)
  },
  (app) => {
    // Safe down migration
    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')
    timeSlots.removeIndex('idx_time_slots_date_0022')
    timeSlots.removeIndex('idx_time_slots_isBooked_0022')
    app.save(timeSlots)

    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.removeIndex('idx_agendamentos_data_0022')
    app.save(agendamentos)
  },
)
