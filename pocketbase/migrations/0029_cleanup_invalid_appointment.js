migrate(
  (app) => {
    try {
      app
        .db()
        .newQuery(`
      DELETE FROM v1_agendamentos 
      WHERE cliente_nome = 'FLAVIO APARECIDO ANTONIO FRANCO DE MOURA'
    `)
        .execute()
    } catch (err) {
      console.error('Migration 0029 failed:', err)
    }
  },
  (app) => {
    // no-op down migration
  },
)
