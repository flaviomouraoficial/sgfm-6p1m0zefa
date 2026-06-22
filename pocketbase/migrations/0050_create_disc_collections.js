migrate(
  (app) => {
    const empresas = new Collection({
      name: 'v1_disc_empresas',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(empresas)

    const links = new Collection({
      name: 'v1_disc_links',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'empresa_id',
          type: 'relation',
          required: false,
          collectionId: empresas.id,
          maxSelect: 1,
        },
        { name: 'usos_permitidos', type: 'number', required: true },
        { name: 'usos_realizados', type: 'number', required: false },
        { name: 'ativo', type: 'bool', required: false },
        { name: 'token', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_disc_links_token ON v1_disc_links (token)'],
    })
    app.save(links)

    const respostas = new Collection({
      name: 'v1_disc_respostas',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: '',
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'link_id', type: 'relation', required: true, collectionId: links.id, maxSelect: 1 },
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'pontuacao_d', type: 'number', required: true },
        { name: 'pontuacao_i', type: 'number', required: true },
        { name: 'pontuacao_s', type: 'number', required: true },
        { name: 'pontuacao_c', type: 'number', required: true },
        { name: 'perfil_predominante', type: 'text', required: true },
        { name: 'respostas_json', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(respostas)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('v1_disc_respostas'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('v1_disc_links'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('v1_disc_empresas'))
    } catch (e) {}
  },
)
