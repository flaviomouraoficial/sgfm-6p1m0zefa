migrate(
  (app) => {
    const tables = [
      'v1_clientes',
      'v1_deals',
      'v1_transactions',
      'v1_mentees',
      'v1_proposals',
      'v1_sessoes',
    ]
    for (const table of tables) {
      try {
        app
          .db()
          .newQuery(
            `DELETE FROM ${table} WHERE LOWER(name) LIKE '%test%' OR LOWER(name) LIKE '%demo%' OR LOWER(name) LIKE '%mock%' OR LOWER(name) LIKE '%fake%'`,
          )
          .execute()
      } catch (e) {}
      try {
        app
          .db()
          .newQuery(
            `DELETE FROM ${table} WHERE LOWER(title) LIKE '%test%' OR LOWER(title) LIKE '%demo%' OR LOWER(title) LIKE '%mock%' OR LOWER(title) LIKE '%fake%'`,
          )
          .execute()
      } catch (e) {}
      try {
        app
          .db()
          .newQuery(
            `DELETE FROM ${table} WHERE LOWER(description) LIKE '%test%' OR LOWER(description) LIKE '%demo%' OR LOWER(description) LIKE '%mock%' OR LOWER(description) LIKE '%fake%'`,
          )
          .execute()
      } catch (e) {}
    }
  },
  (app) => {},
)
