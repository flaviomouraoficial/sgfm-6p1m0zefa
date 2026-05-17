migrate(
  (app) => {
    // Update or create the admin user
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')
      record.setPassword('admin')
      record.set('role', 'admin')
      app.save(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('flavio@trendconsultoria.com.br')
      record.setPassword('admin')
      record.setVerified(true)
      record.set('name', 'Flávio Moura')
      record.set('role', 'admin')
      app.save(record)
    }

    // Add indexes to v1_time_slots for performance
    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')
    timeSlots.addIndex('idx_time_slots_date', false, 'date', '')
    timeSlots.addIndex('idx_time_slots_isBooked', false, 'isBooked', '')
    app.save(timeSlots)

    // Add indexes to v1_agendamentos for performance
    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.addIndex('idx_agendamentos_data', false, 'data_horario', '')
    app.save(agendamentos)
  },
  (app) => {
    // Safe down migration
    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')
    timeSlots.removeIndex('idx_time_slots_date')
    timeSlots.removeIndex('idx_time_slots_isBooked')
    app.save(timeSlots)

    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.removeIndex('idx_agendamentos_data')
    app.save(agendamentos)
  },
)
