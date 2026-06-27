migrate(
  (app) => {
    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentos.listRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || cliente_email = @request.auth.email || mentee_id.email = @request.auth.email"
    agendamentos.viewRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || cliente_email = @request.auth.email || mentee_id.email = @request.auth.email"
    agendamentos.updateRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'"
    agendamentos.deleteRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'"
    app.save(agendamentos)

    const biblioteca = app.findCollectionByNameOrId('v1_biblioteca')
    biblioteca.listRule = "@request.auth.id != ''"
    biblioteca.viewRule = "@request.auth.id != ''"
    app.save(biblioteca)
  },
  (app) => {},
)
