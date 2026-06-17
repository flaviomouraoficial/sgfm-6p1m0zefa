migrate(
  (app) => {
    // Ensure limits in v1_saas_diagnostics
    const diagCol = app.findCollectionByNameOrId('v1_saas_diagnostics')

    if (!diagCol.fields.getByName('limit_strategic')) {
      diagCol.fields.add(new NumberField({ name: 'limit_strategic' }))
    }
    if (!diagCol.fields.getByName('limit_tactical')) {
      diagCol.fields.add(new NumberField({ name: 'limit_tactical' }))
    }
    if (!diagCol.fields.getByName('limit_operational')) {
      diagCol.fields.add(new NumberField({ name: 'limit_operational' }))
    }
    app.save(diagCol)

    // Ensure consultant_notes in v1_saas_results
    const resCol = app.findCollectionByNameOrId('v1_saas_results')
    if (!resCol.fields.getByName('consultant_notes')) {
      resCol.fields.add(new TextField({ name: 'consultant_notes' }))
    }
    app.save(resCol)
  },
  (app) => {
    // No rollback logic required to prevent accidental data loss
  },
)
