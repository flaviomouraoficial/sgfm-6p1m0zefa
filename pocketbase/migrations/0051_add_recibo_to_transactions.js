migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')
    if (!col.fields.getByName('recibo_id')) {
      col.fields.add(
        new RelationField({
          name: 'recibo_id',
          collectionId: app.findCollectionByNameOrId('v1_recibos').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    col.addIndex('idx_transactions_recibo_id', false, 'recibo_id', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')
    try {
      col.removeIndex('idx_transactions_recibo_id')
    } catch (_) {}
    if (col.fields.getByName('recibo_id')) {
      col.fields.removeByName('recibo_id')
    }
    app.save(col)
  },
)
