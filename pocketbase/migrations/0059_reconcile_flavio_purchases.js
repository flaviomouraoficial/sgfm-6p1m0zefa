migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')

      // Ensure the user has admin role to access both admin and client UI
      if (user.getString('role') !== 'admin') {
        user.set('role', 'admin')
        app.save(user)
      }

      // Find pending purchases for this user
      const purchases = app.findRecordsByFilter(
        'v1_saas_credit_purchases',
        `client = '${user.id}' && status = 'pendente'`,
        '-created',
        100,
        0,
      )

      // Update to concluido, triggering the on_purchase_update_balance hook to sync the balance
      for (const purchase of purchases) {
        purchase.set('status', 'concluido')
        app.save(purchase)
      }
    } catch (err) {
      console.log('Migration 0059 error:', err.message)
    }
  },
  (app) => {
    // Down migration: mostly informational, hard to perfectly revert the balance hook
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'flavio@trendconsultoria.com.br')
      if (user.getString('role') !== 'client') {
        user.set('role', 'client')
        app.save(user)
      }
    } catch (err) {
      // Ignore
    }
  },
)
