migrate(
  (app) => {
    // =========================================================================
    // 1. Criar coleção v1_empresas (Multi-CNPJ)
    // =========================================================================
    let empresasCol
    try {
      empresasCol = app.findCollectionByNameOrId('v1_empresas')
    } catch (_) {
      empresasCol = new Collection({
        name: 'v1_empresas',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'razao_social', type: 'text' },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'inscricao_estadual', type: 'text' },
          { name: 'email', type: 'email' },
          { name: 'telefone', type: 'text' },
          { name: 'endereco', type: 'text' },
          { name: 'cidade', type: 'text' },
          { name: 'estado', type: 'text' },
          { name: 'cep', type: 'text' },
          { name: 'is_principal', type: 'bool' },
          { name: 'cor_identificacao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_v1_empresas_cnpj ON v1_empresas (cnpj)'],
      })
      app.save(empresasCol)
    }

    // Seed das duas empresas se ainda não existirem
    let empresa1Id = ''
    try {
      const existing1 = app.findFirstRecordByData('v1_empresas', 'cnpj', '09.465.223/0001-07')
      empresa1Id = existing1.id
    } catch (_) {
      const rec1 = new Record(empresasCol)
      rec1.set('nome', 'Trend Consultoria')
      rec1.set('razao_social', 'Trend Consultoria LTDA')
      rec1.set('cnpj', '09.465.223/0001-07')
      rec1.set('email', 'flavio@trendconsultoria.com.br')
      rec1.set('telefone', '43991273588')
      rec1.set('cidade', 'Londrina')
      rec1.set('estado', 'PR')
      rec1.set('is_principal', true)
      rec1.set('cor_identificacao', '#288f87')
      app.save(rec1)
      empresa1Id = rec1.id
    }

    try {
      app.findFirstRecordByData('v1_empresas', 'cnpj', '45.123.456/0001-89')
    } catch (_) {
      const rec2 = new Record(empresasCol)
      rec2.set('nome', 'Flávio Moura Mentoria')
      rec2.set('razao_social', 'Flávio Moura Treinamentos & Consultoria LTDA')
      rec2.set('cnpj', '45.123.456/0001-89')
      rec2.set('email', 'contato@flaviomoura.com.br')
      rec2.set('telefone', '43996291060')
      rec2.set('cidade', 'Londrina')
      rec2.set('estado', 'PR')
      rec2.set('is_principal', false)
      rec2.set('cor_identificacao', '#1e3a8a')
      app.save(rec2)
    }

    // =========================================================================
    // 2. Criar coleções de Estoque & Materiais
    // =========================================================================
    let produtosCol
    try {
      produtosCol = app.findCollectionByNameOrId('v1_produtos')
    } catch (_) {
      produtosCol = new Collection({
        name: 'v1_produtos',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'codigo', type: 'text', required: true },
          { name: 'nome', type: 'text', required: true },
          { name: 'descricao', type: 'text' },
          { name: 'ano_publicacao', type: 'number' },
          { name: 'preco_compra', type: 'number' },
          { name: 'preco_venda', type: 'number', required: true },
          { name: 'estoque_atual', type: 'number' },
          { name: 'estoque_minimo', type: 'number' },
          { name: 'unidade_medida', type: 'text' },
          { name: 'categoria', type: 'text' },
          { name: 'empresa_id', type: 'relation', collectionId: empresasCol.id, maxSelect: 1 },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_v1_produtos_codigo ON v1_produtos (codigo)'],
      })
      app.save(produtosCol)
    }

    let movimentacoesCol
    try {
      movimentacoesCol = app.findCollectionByNameOrId('v1_estoque_movimentacoes')
    } catch (_) {
      movimentacoesCol = new Collection({
        name: 'v1_estoque_movimentacoes',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'produto_id',
            type: 'relation',
            collectionId: produtosCol.id,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['entrada', 'saida', 'ajuste'],
            maxSelect: 1,
          },
          { name: 'quantidade', type: 'number', required: true },
          { name: 'custo_unitario', type: 'number' },
          { name: 'valor_total', type: 'number' },
          { name: 'nf_numero', type: 'text' },
          { name: 'data', type: 'date', required: true },
          { name: 'observacao', type: 'text' },
          { name: 'empresa_id', type: 'relation', collectionId: empresasCol.id, maxSelect: 1 },
          { name: 'usuario_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(movimentacoesCol)
    }

    let vendasCol
    try {
      vendasCol = app.findCollectionByNameOrId('v1_vendas_materiais')
    } catch (_) {
      const clientesCol = app.findCollectionByNameOrId('v1_clientes')
      vendasCol = new Collection({
        name: 'v1_vendas_materiais',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'numero_pedido', type: 'text', required: true },
          {
            name: 'cliente_id',
            type: 'relation',
            collectionId: clientesCol.id,
            required: true,
            maxSelect: 1,
          },
          { name: 'cliente_nome', type: 'text' },
          { name: 'cliente_documento', type: 'text' },
          { name: 'cliente_endereco', type: 'text' },
          { name: 'itens_json', type: 'json' },
          { name: 'subtotal', type: 'number' },
          { name: 'desconto', type: 'number' },
          { name: 'valor_total', type: 'number', required: true },
          { name: 'nf_numero', type: 'text' },
          { name: 'data_venda', type: 'date', required: true },
          { name: 'observacoes', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: ['concluida', 'pendente', 'cancelada'],
            maxSelect: 1,
          },
          { name: 'forma_pagamento', type: 'text' },
          {
            name: 'transacao_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('v1_transactions').id,
            maxSelect: 1,
          },
          { name: 'empresa_id', type: 'relation', collectionId: empresasCol.id, maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_v1_vendas_materiais_numero ON v1_vendas_materiais (numero_pedido)',
        ],
      })
      app.save(vendasCol)
    }

    // =========================================================================
    // 3. Adicionar empresa_id nas coleções de negócio existentes
    // =========================================================================
    const collectionsToUpdate = [
      'v1_transactions',
      'v1_deals',
      'v1_proposals',
      'v1_clientes',
      'v1_mentees',
      'v1_sessoes',
      'v1_agendamentos',
      'v1_recibos',
      'v1_contas_financeiras',
      'v1_contatos',
      'v1_reunioes_comerciais',
    ]

    for (const colName of collectionsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(colName)
        if (!col.fields.getByName('empresa_id')) {
          col.fields.add(
            new RelationField({
              name: 'empresa_id',
              collectionId: empresasCol.id,
              maxSelect: 1,
            }),
          )
          app.save(col)
        }
      } catch (err) {
        console.log('Erro ao adicionar empresa_id na colecao ' + colName + ': ' + err)
      }
    }

    // =========================================================================
    // 4. Backfill dos dados existentes atribuídos à empresa principal
    // =========================================================================
    if (empresa1Id) {
      for (const colName of collectionsToUpdate) {
        try {
          app
            .db()
            .newQuery(
              `UPDATE ${colName} SET empresa_id = {:empresaId} WHERE empresa_id IS NULL OR empresa_id = ''`,
            )
            .bind({ empresaId: empresa1Id })
            .execute()
        } catch (err) {
          console.log('Erro no backfill da colecao ' + colName + ': ' + err)
        }
      }
    }
  },
  (app) => {
    try {
      const vendasCol = app.findCollectionByNameOrId('v1_vendas_materiais')
      app.delete(vendasCol)
    } catch (_) {}

    try {
      const movCol = app.findCollectionByNameOrId('v1_estoque_movimentacoes')
      app.delete(movCol)
    } catch (_) {}

    try {
      const prodCol = app.findCollectionByNameOrId('v1_produtos')
      app.delete(prodCol)
    } catch (_) {}

    const collectionsToUpdate = [
      'v1_transactions',
      'v1_deals',
      'v1_proposals',
      'v1_clientes',
      'v1_mentees',
      'v1_sessoes',
      'v1_agendamentos',
      'v1_recibos',
      'v1_contas_financeiras',
      'v1_contatos',
      'v1_reunioes_comerciais',
    ]

    for (const colName of collectionsToUpdate) {
      try {
        const col = app.findCollectionByNameOrId(colName)
        if (col.fields.getByName('empresa_id')) {
          col.fields.removeByName('empresa_id')
          app.save(col)
        }
      } catch (_) {}
    }

    try {
      const empCol = app.findCollectionByNameOrId('v1_empresas')
      app.delete(empCol)
    } catch (_) {}
  },
)
