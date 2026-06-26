migrate(
  (app) => {
    const trilhas = app.findCollectionByNameOrId('v1_protensora_trilhas')
    trilhas.fields.add(new TextField({ name: 'icone' }))
    trilhas.fields.add(new TextField({ name: 'cor' }))
    app.save(trilhas)

    const niveis = new Collection({
      name: 'v1_protensora_niveis',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nivel', type: 'number', required: true },
        { name: 'titulo', type: 'text', required: true },
        { name: 'xp_minimo', type: 'number', required: true },
        { name: 'xp_maximo', type: 'number', required: true },
        { name: 'vantagens', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_niveis_nivel ON v1_protensora_niveis (nivel)'],
    })
    app.save(niveis)

    const modulos = app.findCollectionByNameOrId('v1_protensora_modulos')
    const unidades = new Collection({
      name: 'v1_protensora_unidades',
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
        { name: 'titulo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'ordem', type: 'number' },
        { name: 'video_url', type: 'url' },
        { name: 'texto_apoio', type: 'editor' },
        { name: 'xp_conclusao', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(unidades)

    const questoes = app.findCollectionByNameOrId('v1_protensora_questoes')
    questoes.fields.add(
      new RelationField({
        name: 'unidade_id',
        collectionId: unidades.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
    )

    const tipoField = questoes.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['multiple_choice', 'text', 'CERTO_ERRADO', 'MULTIPLA_ESCOLHA']
    }

    questoes.fields.add(new JSONField({ name: 'alternativas' }))
    questoes.fields.add(new TextField({ name: 'resposta_correta' }))
    questoes.fields.add(new TextField({ name: 'explicacao' }))
    questoes.fields.add(new NumberField({ name: 'xp_acerto' }))
    app.save(questoes)

    const reforco = new Collection({
      name: 'v1_protensora_reforco',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'questao_id',
          type: 'relation',
          collectionId: questoes.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'unidade_id',
          type: 'relation',
          collectionId: unidades.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'texto', type: 'editor' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(reforco)

    const avanco = new Collection({
      name: 'v1_protensora_avanco',
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
          collectionId: modulos.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'unidade_origem_id',
          type: 'relation',
          collectionId: unidades.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'texto', type: 'editor' },
        { name: 'xp_bonus', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(avanco)

    const authCollection = app.findCollectionByNameOrId('_pb_users_auth_')
    const partTrilhas = new Collection({
      name: 'v1_protensora_participante_trilhas',
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
          collectionId: authCollection.id,
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
        { name: 'xp_total', type: 'number' },
        { name: 'nivel', type: 'number' },
        { name: 'energia', type: 'number' },
        { name: 'estrelas', type: 'number' },
        { name: 'status', type: 'select', values: ['ativo', 'pausado', 'concluido'] },
        { name: 'started_at', type: 'date' },
        { name: 'completed_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_part_trilha ON v1_protensora_participante_trilhas (user_id, trilha_id)',
      ],
    })
    app.save(partTrilhas)

    const progresso = new Collection({
      name: 'v1_protensora_progresso_unidades',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || participante_id = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || participante_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'participante_id',
          type: 'relation',
          required: true,
          collectionId: authCollection.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'unidade_id',
          type: 'relation',
          required: true,
          collectionId: unidades.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['bloqueada', 'disponivel', 'em_andamento', 'concluida', 'reforco', 'avancada'],
        },
        { name: 'video_assistido', type: 'bool' },
        { name: 'questoes_respondidas', type: 'number' },
        { name: 'questoes_acertadas', type: 'number' },
        { name: 'xp_ganho', type: 'number' },
        { name: 'caminho', type: 'select', values: ['normal', 'reforco', 'avanco'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_prog_unidade ON v1_protensora_progresso_unidades (participante_id, unidade_id)',
      ],
    })
    app.save(progresso)

    const niveisToSeed = [
      { nivel: 1, titulo: 'Iniciante', xp_minimo: 0, xp_maximo: 999 },
      { nivel: 2, titulo: 'Aprendiz', xp_minimo: 1000, xp_maximo: 2499 },
      { nivel: 3, titulo: 'Especialista', xp_minimo: 2500, xp_maximo: 4999 },
      { nivel: 4, titulo: 'Mestre', xp_minimo: 5000, xp_maximo: 9999 },
      { nivel: 5, titulo: 'Lenda', xp_minimo: 10000, xp_maximo: 999999 },
    ]
    for (const n of niveisToSeed) {
      const rec = new Record(niveis)
      rec.set('nivel', n.nivel)
      rec.set('titulo', n.titulo)
      rec.set('xp_minimo', n.xp_minimo)
      rec.set('xp_maximo', n.xp_maximo)
      app.save(rec)
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('v1_protensora_progresso_unidades'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_participante_trilhas'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_avanco'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_reforco'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_unidades'))
    app.delete(app.findCollectionByNameOrId('v1_protensora_niveis'))
  },
)
