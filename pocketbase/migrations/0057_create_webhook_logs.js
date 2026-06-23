migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_webhook_logs',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'provider', type: 'text', required: true },
        { name: 'event_type', type: 'text', required: false },
        { name: 'payload', type: 'json', required: false },
        { name: 'status', type: 'select', required: true, values: ['success', 'error', 'pending'] },
        { name: 'status_code', type: 'number', required: false },
        { name: 'error_message', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_webhook_logs')
    app.delete(collection)
  },
)
