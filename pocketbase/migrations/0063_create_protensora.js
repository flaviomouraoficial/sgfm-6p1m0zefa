migrate(
  (app) => {
    const trilhas = new Collection({
      name: 'v1_protensora_trilhas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(trilhas)

    const modulos = new Collection({
      name: 'v1_protensora_modulos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'trilha_id',
          type: 'relation',
          required: true,
          collectionId: trilhas.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(modulos)

    const questoes = new Collection({
      name: 'v1_protensora_questoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'modulo_id',
          type: 'relation',
          required: true,
          collectionId: modulos.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'text', type: 'text', required: true },
        { name: 'type', type: 'select', required: true, values: ['multiple_choice', 'text'] },
        { name: 'options', type: 'json' },
        { name: 'weight', type: 'number' },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(questoes)

    const respostas = new Collection({
      name: 'v1_protensora_respostas',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
      createRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
      updateRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'questao_id',
          type: 'relation',
          required: true,
          collectionId: questoes.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'modulo_id',
          type: 'relation',
          required: true,
          collectionId: modulos.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'trilha_id',
          type: 'relation',
          required: true,
          collectionId: trilhas.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'answer_value', type: 'json' },
        { name: 'score', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_protensora_resposta_user_questao ON v1_protensora_respostas (user_id, questao_id)',
        'CREATE INDEX idx_protensora_resposta_modulo ON v1_protensora_respostas (modulo_id)',
        'CREATE INDEX idx_protensora_resposta_trilha ON v1_protensora_respostas (trilha_id)',
      ],
    })
    app.save(respostas)

    const progresso = new Collection({
      name: 'v1_protensora_progresso',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || user_id = @request.auth.id",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'trilha_id',
          type: 'relation',
          required: true,
          collectionId: trilhas.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'percentage', type: 'number' },
        { name: 'score', type: 'number' },
        { name: 'completed', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_protensora_prog_user_trilha ON v1_protensora_progresso (user_id, trilha_id)',
      ],
    })
    app.save(progresso)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('v1_protensora_progresso'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_respostas'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_questoes'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_modulos'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_trilhas'))
  },
)
