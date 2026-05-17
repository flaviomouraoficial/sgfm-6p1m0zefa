migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_time_slots')
    col.updateRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_time_slots')
    col.updateRule = ''
    app.save(col)
  },
)
