migrate(
  (app) => {
    const collections = [
      new Collection({
        name: 'v1_clientes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'phone', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'v1_servicos',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'duracao_minutos', type: 'number' },
          { name: 'preco', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'v1_profissionais',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'especialidade', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
      new Collection({
        name: 'settings_store',
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

    const v1_agendamentos = new Collection({
      name: 'v1_agendamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: '',
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'profissional_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('v1_profissionais').id,
          maxSelect: 1,
        },
        {
          name: 'servico_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('v1_servicos').id,
          maxSelect: 1,
        },
        { name: 'data_horario', type: 'date' },
        { name: 'cliente_nome', type: 'text', required: true },
        { name: 'cliente_email', type: 'email' },
        { name: 'cliente_telefone', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(v1_agendamentos)
  },
  (app) => {
    const names = [
      'v1_agendamentos',
      'v1_clientes',
      'v1_servicos',
      'v1_profissionais',
      'settings_store',
    ]
    for (const name of names) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
