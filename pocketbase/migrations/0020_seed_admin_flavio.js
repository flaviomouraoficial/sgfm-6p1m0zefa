migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      const record = app.findAuthRecordByEmail('users', 'flavio@trendconsultoria.com.br')
      record.set('role', 'admin')
      record.setPassword('admin')
      record.setVerified(true)
      app.saveNoValidate(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('flavio@trendconsultoria.com.br')
      record.setPassword('admin')
      record.setVerified(true)
      record.set('name', 'Flávio Moura')
      record.set('role', 'admin')
      app.saveNoValidate(record)
    }

    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')
    timeSlots.addIndex('idx_v1_time_slots_date', false, 'date', '')
    timeSlots.addIndex('idx_v1_time_slots_isBooked', false, 'isBooked', '')
    app.save(timeSlots)

    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.addIndex('idx_v1_agendamentos_data_horario', false, 'data_horario', '')
    app.save(agendamentos)
  },
  (app) => {
    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')
    timeSlots.removeIndex('idx_v1_time_slots_date')
    timeSlots.removeIndex('idx_v1_time_slots_isBooked')
    app.save(timeSlots)

    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.removeIndex('idx_v1_agendamentos_data_horario')
    app.save(agendamentos)
  },
)
