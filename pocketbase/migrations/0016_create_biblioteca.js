migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_biblioteca',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'autor', type: 'text', required: true },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['Ficção', 'Biografia', 'Autodesenvolvimento', 'Técnico', 'Outras'],
          maxSelect: 1,
        },
        { name: 'palavras_chave', type: 'text' },
        { name: 'descricao', type: 'text' },
        { name: 'observacoes', type: 'text' },
        {
          name: 'status_leitura',
          type: 'select',
          required: true,
          values: ['Não lido', 'Lendo', 'Lido'],
          maxSelect: 1,
        },
        { name: 'favorito', type: 'bool' },
        {
          name: 'capa_file',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'capa_url', type: 'url' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_biblioteca')
    app.delete(collection)
  },
)
