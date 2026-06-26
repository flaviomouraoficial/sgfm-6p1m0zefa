migrate(
  (app) => {
    const conquistas = new Collection({
      name: 'v1_protensora_conquistas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'icon', type: 'text' },
        {
          name: 'requirement_type',
          type: 'select',
          values: ['first_step', 'module_done', 'trail_master', 'perfect_score'],
          required: true,
        },
        { name: 'requirement_value', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(conquistas)

    const conquistasUsuario = new Collection({
      name: 'v1_protensora_conquistas_usuario',
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
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'conquista_id',
          type: 'relation',
          collectionId: conquistas.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'trail_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('v1_protensora_trilhas').id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'earned_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_protensora_conquistas_user ON v1_protensora_conquistas_usuario (user_id, conquista_id, trail_id)',
      ],
    })
    app.save(conquistasUsuario)

    const seed = [
      {
        name: 'Primeiros Passos',
        description: 'Respondeu à sua primeira questão.',
        icon: 'Footprints',
        requirement_type: 'first_step',
      },
      {
        name: 'Módulo Concluído',
        description: 'Concluiu 100% de um módulo.',
        icon: 'CheckCircle',
        requirement_type: 'module_done',
      },
      {
        name: 'Mestre da Trilha',
        description: 'Completou todos os módulos de uma trilha.',
        icon: 'Trophy',
        requirement_type: 'trail_master',
      },
      {
        name: 'Excelência',
        description: 'Acertou todas as questões de um módulo.',
        icon: 'Star',
        requirement_type: 'perfect_score',
      },
    ]

    for (const d of seed) {
      const rec = new Record(conquistas)
      rec.set('name', d.name)
      rec.set('description', d.description)
      rec.set('icon', d.icon)
      rec.set('requirement_type', d.requirement_type)
      app.save(rec)
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('v1_protensora_conquistas_usuario'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_conquistas'))
  },
)
