migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_proposals')
    if (!col.fields.getByName('condicoes_comerciais')) {
      col.fields.add(
        new JSONField({
          name: 'condicoes_comerciais',
          maxSize: 2000000,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_proposals')
    if (col.fields.getByName('condicoes_comerciais')) {
      col.fields.removeByName('condicoes_comerciais')
      app.save(col)
    }
  },
)
