migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_agendamentos')

    if (!col.fields.getByName('mentee_id')) {
      const menteesCol = app.findCollectionByNameOrId('v1_mentees')
      col.fields.add(
        new RelationField({
          name: 'mentee_id',
          collectionId: menteesCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_agendamentos')

    if (col.fields.getByName('mentee_id')) {
      col.fields.removeByName('mentee_id')
      app.save(col)
    }
  },
)
