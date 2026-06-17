migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_saas_questions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'diagnostic',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('v1_saas_diagnostics').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'dimension', type: 'text', required: true },
        { name: 'text', type: 'text', required: true },
        { name: 'order', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('v1_saas_questions')
      app.delete(collection)
    } catch (_) {}
  },
)
