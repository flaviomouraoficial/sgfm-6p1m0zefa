migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_saas_diagnostics')

    if (!col.fields.getByName('limit_strategic')) {
      col.fields.add(new NumberField({ name: 'limit_strategic', min: 0 }))
    }
    if (!col.fields.getByName('limit_tactical')) {
      col.fields.add(new NumberField({ name: 'limit_tactical', min: 0 }))
    }
    if (!col.fields.getByName('limit_operational')) {
      col.fields.add(new NumberField({ name: 'limit_operational', min: 0 }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_saas_diagnostics')
    col.fields.removeByName('limit_strategic')
    col.fields.removeByName('limit_tactical')
    col.fields.removeByName('limit_operational')
    app.save(col)
  },
)
