migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')
    if (!col.fields.getByName('document_number')) {
      col.fields.add(
        new TextField({
          name: 'document_number',
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')
    if (col.fields.getByName('document_number')) {
      col.fields.removeByName('document_number')
    }
    app.save(col)
  },
)
