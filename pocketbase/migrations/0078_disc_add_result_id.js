migrate(
  (app) => {
    const resultsCol = app.findCollectionByNameOrId('v1_saas_results')
    if (!resultsCol.fields.getByName('nivel_relatorio')) {
      resultsCol.fields.add(
        new SelectField({
          name: 'nivel_relatorio',
          values: ['essencial', 'intermediario', 'completo'],
          maxSelect: 1,
        }),
      )
    }
    app.save(resultsCol)

    app
      .db()
      .newQuery(`
      UPDATE v1_saas_results
      SET nivel_relatorio = 'essencial'
      WHERE nivel_relatorio IS NULL OR nivel_relatorio = ''
    `)
      .execute()

    const discCol = app.findCollectionByNameOrId('v1_disc_respostas')
    if (!discCol.fields.getByName('result_id')) {
      discCol.fields.add(
        new RelationField({
          name: 'result_id',
          collectionId: app.findCollectionByNameOrId('v1_saas_results').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    if (!discCol.fields.getByName('nivel_relatorio')) {
      discCol.fields.add(
        new SelectField({
          name: 'nivel_relatorio',
          values: ['essencial', 'intermediario', 'completo'],
          maxSelect: 1,
        }),
      )
    }
    app.save(discCol)

    app
      .db()
      .newQuery(`
      UPDATE v1_disc_respostas
      SET nivel_relatorio = 'essencial'
      WHERE nivel_relatorio IS NULL OR nivel_relatorio = ''
    `)
      .execute()
  },
  (app) => {
    const resultsCol = app.findCollectionByNameOrId('v1_saas_results')
    if (resultsCol.fields.getByName('nivel_relatorio')) {
      resultsCol.fields.removeByName('nivel_relatorio')
      app.save(resultsCol)
    }
    const discCol = app.findCollectionByNameOrId('v1_disc_respostas')
    if (discCol.fields.getByName('result_id')) {
      discCol.fields.removeByName('result_id')
    }
    if (discCol.fields.getByName('nivel_relatorio')) {
      discCol.fields.removeByName('nivel_relatorio')
    }
    app.save(discCol)
  },
)
