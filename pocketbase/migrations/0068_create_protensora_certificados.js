migrate(
  (app) => {
    let certCol
    try {
      certCol = app.findCollectionByNameOrId('v1_protensora_certificados')
    } catch (_) {
      certCol = new Collection({
        name: 'v1_protensora_certificados',
        type: 'base',
        listRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
        viewRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
        createRule: null,
        updateRule: null,
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'trilha_id',
            type: 'relation',
            required: true,
            collectionId: 'v1_protensora_trilhas',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'issue_date', type: 'date', required: true },
          { name: 'final_score', type: 'number', required: true },
          {
            name: 'certificate_file',
            type: 'file',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['application/pdf'],
          },
          { name: 'codigo_verificacao', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(certCol)
    }
  },
  (app) => {
    try {
      const certCol = app.findCollectionByNameOrId('v1_protensora_certificados')
      app.delete(certCol)
    } catch (_) {}
  },
)
