migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')

      // Set role to 'client' so it can access the /saas/credits route via AuthGuard
      record.set('role', 'client')

      // Provision required permissions for the frontend features
      let currentPerms = {}
      try {
        const p = record.get('permissions')
        if (typeof p === 'string') {
          currentPerms = JSON.parse(p || '{}')
        } else {
          currentPerms = p || {}
        }
      } catch (e) {
        // Ignore parse error
      }

      record.set(
        'permissions',
        Object.assign({}, currentPerms, {
          links: true,
          agenda: true,
          credits: true,
          reports: true,
          saas_access: true,
          buy_credits: true,
        }),
      )

      app.save(record)

      // Ensure v1_clientes has a matching record, simulating the on_user_client_sync behavior
      let cliente = null
      try {
        cliente = app.findFirstRecordByData(
          'v1_clientes',
          'email',
          'flavio@trendconsultoria.com.br',
        )
      } catch (_) {}

      if (!cliente) {
        const col = app.findCollectionByNameOrId('v1_clientes')
        cliente = new Record(col)
        cliente.set('name', record.getString('name') || 'Flavio Moura')
        cliente.set('email', 'flavio@trendconsultoria.com.br')
        cliente.set('status', 'Ativo')
        app.save(cliente)
      }
    } catch (_) {
      // User might not exist during clean installation or tests, skip if so
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')
      record.set('role', 'admin')
      app.save(record)
    } catch (_) {}
  },
)
