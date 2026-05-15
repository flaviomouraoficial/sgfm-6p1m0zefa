migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_reports',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'month', type: 'text', required: true },
        { name: 'totalRevenue', type: 'number' },
        { name: 'totalExpenses', type: 'number' },
        { name: 'netBalance', type: 'number' },
        { name: 'data', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_reports')
    app.delete(collection)
  },
)
