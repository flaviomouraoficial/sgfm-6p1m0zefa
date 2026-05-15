migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')

    if (!col.fields.getByName('client_id')) {
      col.fields.add(
        new RelationField({
          name: 'client_id',
          collectionId: app.findCollectionByNameOrId('v1_clientes').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    if (!col.fields.getByName('mentee_id')) {
      col.fields.add(
        new RelationField({
          name: 'mentee_id',
          collectionId: app.findCollectionByNameOrId('v1_mentees').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    if (!col.fields.getByName('session_id')) {
      col.fields.add(
        new RelationField({
          name: 'session_id',
          collectionId: app.findCollectionByNameOrId('v1_sessoes').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    if (!col.fields.getByName('account')) {
      col.fields.add(
        new TextField({
          name: 'account',
        }),
      )
    }
    app.save(col)
  },
  (app) => {},
)
