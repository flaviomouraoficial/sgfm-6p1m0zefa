migrate(
  (app) => {
    const emails = ['flavio@trendconsultoria.com.br', 'admin@grupoflaviomoura.com.br']
    for (const email of emails) {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', email)
        record.set('role', 'admin')
        app.save(record)
      } catch (_) {}
    }
  },
  (app) => {
    // no-op
  },
)
