migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_sessoes')
    if (!col.fields.getByName('projeto')) {
      col.fields.add(new TextField({ name: 'projeto' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_sessoes')
    col.fields.removeByName('projeto')
    app.save(col)
  },
)
