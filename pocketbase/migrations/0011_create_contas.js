migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_contas_financeiras',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          values: ['Corrente', 'Poupança', 'Caixa', 'Investimento'],
          maxSelect: 1,
          required: true,
        },
        { name: 'saldo_inicial', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_contas_financeiras')
    app.delete(collection)
  },
)
