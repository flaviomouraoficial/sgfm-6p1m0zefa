migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_proposals')
    const clientesId = app.findCollectionByNameOrId('v1_clientes').id

    if (!col.fields.getByName('cliente_id')) {
      col.fields.add(
        new RelationField({
          name: 'cliente_id',
          collectionId: clientesId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    const textFields = [
      'nome_contato',
      'nome_evento',
      'objetivo',
      'publico_alvo',
      'cronograma',
      'local',
      'formato',
      'estrutura_programa',
      'condicoes_pagamento',
      'validade_proposta',
      'texto_institucional',
      'condicoes_gerais',
      'perfil_instrutor',
    ]

    for (const name of textFields) {
      if (!col.fields.getByName(name)) {
        col.fields.add(new TextField({ name }))
      }
    }

    const numberFields = ['valor_modulo_4h', 'valor_modulo_8h', 'valor_global']
    for (const name of numberFields) {
      if (!col.fields.getByName(name)) {
        col.fields.add(new NumberField({ name }))
      }
    }

    if (!col.fields.getByName('data_geracao')) {
      col.fields.add(new DateField({ name: 'data_geracao' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_proposals')
    const fieldsToRemove = [
      'cliente_id',
      'nome_contato',
      'nome_evento',
      'objetivo',
      'publico_alvo',
      'cronograma',
      'local',
      'formato',
      'estrutura_programa',
      'valor_modulo_4h',
      'valor_modulo_8h',
      'valor_global',
      'condicoes_pagamento',
      'validade_proposta',
      'data_geracao',
      'texto_institucional',
      'condicoes_gerais',
      'perfil_instrutor',
    ]
    for (const name of fieldsToRemove) {
      if (col.fields.getByName(name)) {
        col.fields.removeByName(name)
      }
    }
    app.save(col)
  },
)
