migrate(
  (app) => {
    app
      .db()
      .newQuery(`
      UPDATE v1_transactions
      SET type = 'Receita'
      WHERE type IN ('Crédito', 'credito', 'credit', 'income', 'Receita')
    `)
      .execute()

    app
      .db()
      .newQuery(`
      UPDATE v1_transactions
      SET type = 'Despesa'
      WHERE type IN ('Débito', 'debito', 'debit', 'expense', 'Gasto', 'gasto', 'Despesa')
    `)
      .execute()

    app
      .db()
      .newQuery(`
      UPDATE v1_transactions
      SET type = 'Receita'
      WHERE type IS NULL OR type = ''
    `)
      .execute()

    const col = app.findCollectionByNameOrId('v1_transactions')
    if (!col.fields.getByName('proposta_id')) {
      col.fields.add(
        new RelationField({
          name: 'proposta_id',
          collectionId: app.findCollectionByNameOrId('v1_proposals').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(col)

    const propCol = app.findCollectionByNameOrId('v1_proposals')
    if (!propCol.fields.getByName('deal_id')) {
      propCol.fields.add(
        new RelationField({
          name: 'deal_id',
          collectionId: app.findCollectionByNameOrId('v1_deals').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(propCol)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')
    if (col.fields.getByName('proposta_id')) {
      col.fields.removeByName('proposta_id')
      app.save(col)
    }
    const propCol = app.findCollectionByNameOrId('v1_proposals')
    if (propCol.fields.getByName('deal_id')) {
      propCol.fields.removeByName('deal_id')
      app.save(propCol)
    }
  },
)
