migrate(
  (app) => {
    // Ensure that 'pago' values are consistently capitalized as 'Pago' in transactions
    // to avoid any exact match issues in legacy code parts, though our TS logic uses toLowerCase().
    app
      .db()
      .newQuery("UPDATE v1_transactions SET status = 'Pago' WHERE LOWER(status) = 'pago'")
      .execute()
    app
      .db()
      .newQuery("UPDATE v1_recibos SET status = 'Pago' WHERE LOWER(status) = 'pago'")
      .execute()
  },
  (app) => {
    // No revert needed
  },
)
