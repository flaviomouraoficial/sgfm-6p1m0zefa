migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_agendamentos')
    col.listRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || cliente_email = @request.auth.email || mentee_id.email = @request.auth.email"
    col.viewRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || cliente_email = @request.auth.email || mentee_id.email = @request.auth.email"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_agendamentos')
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    app.save(col)
  },
)
