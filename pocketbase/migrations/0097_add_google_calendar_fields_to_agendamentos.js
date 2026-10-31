migrate(
  (app) => {
    const agCol = app.findCollectionByNameOrId('v1_agendamentos')
    const fieldsToAdd = [
      { name: 'google_event_id', type: 'text' },
      { name: 'google_sync_status', type: 'text' }, // 'synced' | 'pending' | 'error' | 'not_synced'
      { name: 'google_sync_error', type: 'text' },
      { name: 'google_synced_at', type: 'date' },
    ]

    for (const f of fieldsToAdd) {
      if (!agCol.fields.getByName(f.name)) {
        if (f.type === 'date') {
          agCol.fields.add(new DateField({ name: f.name }))
        } else {
          agCol.fields.add(new TextField({ name: f.name }))
        }
      }
    }
    app.save(agCol)
  },
  (app) => {
    try {
      const agCol = app.findCollectionByNameOrId('v1_agendamentos')
      const fieldsToRemove = [
        'google_event_id',
        'google_sync_status',
        'google_sync_error',
        'google_synced_at',
      ]
      for (const name of fieldsToRemove) {
        const field = agCol.fields.getByName(name)
        if (field) {
          agCol.fields.remove(field)
        }
      }
      app.save(agCol)
    } catch (_) {}
  },
)
