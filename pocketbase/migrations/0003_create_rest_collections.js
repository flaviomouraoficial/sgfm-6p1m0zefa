migrate(
  (app) => {
    const collections = [
      new Collection({
        name: 'v1_deals',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'clientName', type: 'text' },
          { name: 'value', type: 'number' },
          { name: 'stage', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'email', type: 'email' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'v1_transactions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'description', type: 'text' },
          { name: 'amount', type: 'number' },
          { name: 'type', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'category', type: 'text' },
          { name: 'date', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'v1_mentees',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'status', type: 'text' },
          { name: 'company', type: 'text' },
          { name: 'contractValue', type: 'number' },
          { name: 'totalSessions', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'v1_proposals',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'value', type: 'number' },
          { name: 'status', type: 'text' },
          { name: 'expirationDate', type: 'date' },
          { name: 'description', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'v1_sessoes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'date', type: 'date' },
          { name: 'notes', type: 'text' },
          { name: 'type', type: 'text' },
          { name: 'duration', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'v1_time_slots',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'date', type: 'date' },
          { name: 'time', type: 'text' },
          { name: 'isBooked', type: 'bool' },
          { name: 'description', type: 'text' },
          { name: 'menteeName', type: 'text' },
          { name: 'menteeEmail', type: 'email' },
          { name: 'menteePhone', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'forecasts_store',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'data', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
    ]

    for (const c of collections) {
      app.save(c)
    }
  },
  (app) => {
    const names = [
      'v1_deals',
      'v1_transactions',
      'v1_mentees',
      'v1_proposals',
      'v1_sessoes',
      'v1_time_slots',
      'forecasts_store',
    ]
    for (const name of names) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
