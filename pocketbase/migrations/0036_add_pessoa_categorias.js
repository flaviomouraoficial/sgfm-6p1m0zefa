migrate(
  (app) => {
    // Clear data to avoid conflicts with new relations
    app.truncateCollection(app.findCollectionByNameOrId('v1_agendamentos'))
    app.truncateCollection(app.findCollectionByNameOrId('v1_mentees'))
    app.truncateCollection(app.findCollectionByNameOrId('v1_clientes'))

    // Create v1_pessoa_categorias
    const categorias = new Collection({
      name: 'v1_pessoa_categorias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(categorias)

    // Seed default categories
    const cat1 = new Record(categorias)
    cat1.set('nome', 'Mentorado')
    app.save(cat1)

    const cat2 = new Record(categorias)
    cat2.set('nome', 'Sucessor')
    app.save(cat2)

    const cat3 = new Record(categorias)
    cat3.set('nome', 'Outro')
    app.save(cat3)

    // Add cnpj to v1_clientes
    const clientes = app.findCollectionByNameOrId('v1_clientes')
    clientes.fields.add(new TextField({ name: 'cnpj', required: false }))
    app.save(clientes)

    // Add relations to v1_mentees
    const mentees = app.findCollectionByNameOrId('v1_mentees')
    mentees.fields.add(
      new RelationField({
        name: 'cliente_id',
        collectionId: clientes.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    mentees.fields.add(
      new RelationField({
        name: 'categoria_id',
        collectionId: categorias.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(mentees)
  },
  (app) => {
    const mentees = app.findCollectionByNameOrId('v1_mentees')
    try {
      mentees.fields.removeByName('cliente_id')
    } catch (_) {}
    try {
      mentees.fields.removeByName('categoria_id')
    } catch (_) {}
    app.save(mentees)

    const clientes = app.findCollectionByNameOrId('v1_clientes')
    try {
      clientes.fields.removeByName('cnpj')
    } catch (_) {}
    app.save(clientes)

    try {
      const categorias = app.findCollectionByNameOrId('v1_pessoa_categorias')
      app.delete(categorias)
    } catch (_) {}
  },
)
