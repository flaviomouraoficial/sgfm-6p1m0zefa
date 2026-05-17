migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_sessoes')

    if (!col.fields.getByName('agendamento_id')) {
      col.fields.add(
        new RelationField({
          name: 'agendamento_id',
          collectionId: app.findCollectionByNameOrId('v1_agendamentos').id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_sessoes')
    if (col.fields.getByName('agendamento_id')) {
      col.fields.removeByName('agendamento_id')
      app.save(col)
    }
  },
)
