migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE v1_recibos SET status = 'Pendente' WHERE status IS NULL OR status = ''")
      .execute()
  },
  (app) => {
    // No down migration required
  },
)
