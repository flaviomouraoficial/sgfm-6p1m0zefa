migrate(
  (app) => {
    const adminOnly =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || @request.auth.email = 'admin@grupoflaviomoura.com.br'"

    const collections = [
      'v1_clientes',
      'v1_deals',
      'v1_transactions',
      'v1_proposals',
      'forecasts_store',
    ]

    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = adminOnly
        col.viewRule = adminOnly
        col.createRule = adminOnly
        col.updateRule = adminOnly
        col.deleteRule = adminOnly
        app.save(col)
      } catch (e) {}
    }

    try {
      const sessoes = app.findCollectionByNameOrId('v1_sessoes')
      sessoes.listRule = adminOnly + ' || mentee_id.email = @request.auth.email'
      sessoes.viewRule = adminOnly + ' || mentee_id.email = @request.auth.email'
      sessoes.createRule = adminOnly
      sessoes.updateRule = adminOnly
      sessoes.deleteRule = adminOnly
      app.save(sessoes)
    } catch (e) {}

    try {
      const mentees = app.findCollectionByNameOrId('v1_mentees')
      mentees.listRule = adminOnly + ' || email = @request.auth.email'
      mentees.viewRule = adminOnly + ' || email = @request.auth.email'
      mentees.createRule = adminOnly
      mentees.updateRule = adminOnly
      mentees.deleteRule = adminOnly
      app.save(mentees)
    } catch (e) {}

    try {
      const users = app.findCollectionByNameOrId('users')
      users.listRule = adminOnly + ' || id = @request.auth.id'
      users.viewRule = adminOnly + ' || id = @request.auth.id'
      app.save(users)
    } catch (e) {}
  },
  (app) => {},
)
