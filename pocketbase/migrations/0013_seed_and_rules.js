migrate(
  (app) => {
    // Update Rules for v1_transactions, v1_deals, v1_proposals
    const adminRule = "@request.auth.role = 'admin'"

    ;['v1_transactions', 'v1_deals', 'v1_proposals'].forEach((name) => {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = adminRule
        col.viewRule = adminRule
        col.createRule = adminRule
        col.updateRule = adminRule
        col.deleteRule = adminRule
        app.save(col)
      } catch (_) {}
    })

    // Seed default account
    try {
      app.findFirstRecordByData('v1_contas_financeiras', 'nome', 'Conta Principal')
    } catch (_) {
      const contasCol = app.findCollectionByNameOrId('v1_contas_financeiras')
      const record = new Record(contasCol)
      record.set('nome', 'Conta Principal')
      record.set('tipo', 'Corrente')
      record.set('saldo_inicial', 0)
      app.save(record)

      // Assign existing transactions to this account
      app
        .db()
        .newQuery(
          `UPDATE v1_transactions SET conta_id = {:contaId} WHERE conta_id = '' OR conta_id IS NULL`,
        )
        .bind({ contaId: record.id })
        .execute()
    }
  },
  (app) => {
    // Can't reliably revert rules to the complex string without hardcoding it.
  },
)
