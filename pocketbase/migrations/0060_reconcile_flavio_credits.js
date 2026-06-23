migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('users', 'flavio@trendconsultoria.com.br')

      const purchases = app.findRecordsByFilter(
        'v1_saas_credit_purchases',
        "client = '" + user.id + "' && status = 'pendente'",
        '',
        1000,
        0,
      )

      if (!purchases || purchases.length === 0) return

      let totalCredits = 0
      const purchaseIds = []

      for (const p of purchases) {
        totalCredits += p.getInt('credits')
        purchaseIds.push(p.id)
      }

      // SQLite format inside PocketBase
      const now = new Date().toISOString().replace('T', ' ')

      app.runInTransaction((txApp) => {
        // Usamos raw SQL para evitar disparar o hook "on_purchase_update_balance" e duplicar os créditos
        for (const id of purchaseIds) {
          txApp
            .db()
            .newQuery(
              "UPDATE v1_saas_credit_purchases SET status = 'concluido', updated = {:now} WHERE id = {:id}",
            )
            .bind({ id: id, now: now })
            .execute()
        }

        const txUser = txApp.findRecordById('users', user.id)
        const newBalance = txUser.getInt('balance') + totalCredits

        txApp
          .db()
          .newQuery(
            'UPDATE users SET balance = {:newBalance}, updated = {:now} WHERE id = {:userId}',
          )
          .bind({ newBalance: newBalance, now: now, userId: user.id })
          .execute()
      })

      console.log(
        `Migration 0060: Updated ${purchaseIds.length} purchases, added ${totalCredits} credits for flavio.`,
      )
    } catch (err) {
      console.log('Migration 0060 error:', err.message)
    }
  },
  (app) => {},
)
