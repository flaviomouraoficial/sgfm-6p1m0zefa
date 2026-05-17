migrate(
  (app) => {
    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')

    agendamentos.addIndex('idx_agendamentos_cliente_email', false, 'cliente_email', '')
    app.save(agendamentos)

    timeSlots.addIndex('idx_time_slots_date_booked', false, 'date, isBooked', '')
    app.save(timeSlots)
  },
  (app) => {
    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.removeIndex('idx_agendamentos_cliente_email')
    app.save(agendamentos)

    const timeSlots = app.findCollectionByNameOrId('v1_time_slots')
    timeSlots.removeIndex('idx_time_slots_date_booked')
    app.save(timeSlots)
  },
)
