migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_assessment_calculos')
    col.fields.add(new JSONField({ name: 'consultant_notes' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_assessment_calculos')
    col.fields.removeByName('consultant_notes')
    app.save(col)
  },
)
