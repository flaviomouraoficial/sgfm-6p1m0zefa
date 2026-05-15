migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')

    col.fields.add(
      new RelationField({
        name: 'conta_id',
        collectionId: app.findCollectionByNameOrId('v1_contas_financeiras').id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )

    col.fields.add(
      new BoolField({
        name: 'conciliado',
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')
    col.fields.removeByName('conta_id')
    col.fields.removeByName('conciliado')
    app.save(col)
  },
)
