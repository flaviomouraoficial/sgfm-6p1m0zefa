migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_saas_results')
    col.deleteRule = "@request.auth.role = 'admin' || client = @request.auth.id"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_saas_results')
    col.deleteRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
