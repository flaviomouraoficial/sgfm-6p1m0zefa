migrate(
  (app) => {
    // 1. Assessment Links
    const links = new Collection({
      name: 'v1_assessment_links',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('v1_clientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'link_unico', type: 'text', required: true },
        { name: 'quantidade_permitida', type: 'number', required: true, min: 1 },
        { name: 'quantidade_usada', type: 'number', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'inativo', 'expirado'],
          maxSelect: 1,
        },
        { name: 'data_expiracao', type: 'date', required: false },
        {
          name: 'criado_por',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_assessment_links_unico ON v1_assessment_links (link_unico)',
      ],
    })
    app.save(links)

    // 2. Assessment Respostas
    const respostas = new Collection({
      name: 'v1_assessment_respostas',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null, // Only via custom hook to ensure integrity
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'link_id',
          type: 'relation',
          required: true,
          collectionId: links.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'cliente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('v1_clientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome_respondente', type: 'text', required: true },
        { name: 'email_respondente', type: 'email', required: true },
        {
          name: 'grau_parentesco',
          type: 'select',
          required: true,
          values: [
            'socio',
            'gerente',
            'filho',
            'filha',
            'genro',
            'nora',
            'sobrinho',
            'sobrinha',
            'outro',
          ],
          maxSelect: 1,
        },
        { name: 'atua_na_organizacao', type: 'bool', required: false },
        { name: 'respostas_json', type: 'json', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['completo', 'incompleto', 'em_progresso'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(respostas)

    // 3. Assessment Calculos
    const calculos = new Collection({
      name: 'v1_assessment_calculos',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null, // Only via custom hook
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'resposta_id',
          type: 'relation',
          required: true,
          collectionId: respostas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'pilar_1_media', type: 'number', required: true },
        { name: 'pilar_2_media', type: 'number', required: true },
        { name: 'pilar_3_media', type: 'number', required: true },
        { name: 'pilar_4_media', type: 'number', required: true },
        { name: 'pilar_5_media', type: 'number', required: true },
        { name: 'pilar_6_media', type: 'number', required: true },
        { name: 'pilar_7_media', type: 'number', required: true },
        { name: 'pilar_8_media', type: 'number', required: true },
        { name: 'pilar_9_media', type: 'number', required: true },
        { name: 'mapeamento_agro_media', type: 'number', required: true },
        {
          name: 'estado_sucessao',
          type: 'select',
          required: true,
          values: ['verde', 'amarelo', 'vermelho'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(calculos)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('v1_assessment_calculos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('v1_assessment_respostas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('v1_assessment_links'))
    } catch (_) {}
  },
)
