migrate(
  (app) => {
    const time_slots = app.findCollectionByNameOrId('v1_time_slots')
    app.truncateCollection(time_slots)

    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    app.truncateCollection(agendamentos)

    const deals = app.findCollectionByNameOrId('v1_deals')
    app.truncateCollection(deals)
  },
  (app) => {
    // Truncate commands cannot be safely reverted without backups.
  },
)
