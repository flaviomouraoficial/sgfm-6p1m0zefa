migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_contatos',
      type: 'base',
      listRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      viewRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      createRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      updateRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      deleteRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'empresa', type: 'text', required: false },
        { name: 'email', type: 'email', required: false },
        { name: 'whatsapp', type: 'text', required: false },
        { name: 'data_captura', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contatos_email ON v1_contatos (email)',
        'CREATE INDEX idx_contatos_data_captura ON v1_contatos (data_captura)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_contatos')
    app.delete(collection)
  },
)
