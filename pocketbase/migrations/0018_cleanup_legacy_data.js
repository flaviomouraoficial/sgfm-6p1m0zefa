migrate(
  (app) => {
    const collections = [
      'v1_clientes',
      'v1_agendamentos',
      'v1_deals',
      'v1_transactions',
      'v1_mentees',
      'v1_proposals',
      'v1_sessoes',
      'v1_time_slots',
    ]

    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.truncateCollection(col)
      } catch (e) {
        console.log(`Failed to truncate collection ${name}:`, e)
      }
    }
  },
  (app) => {
    // Revert not possible for deleted data
  },
)
