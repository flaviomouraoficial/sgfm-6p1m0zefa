migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@grupoflaviomoura.com.br')
      existing.setPassword('admin1234')
      existing.set('role', 'admin')
      existing.set('name', 'Administrador')
      app.save(existing)
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('admin@grupoflaviomoura.com.br')
    record.setPassword('admin1234')
    record.setVerified(true)
    record.set('name', 'Administrador')
    record.set('role', 'admin')
    app.save(record)
  },
  (app) => {
    // Revert not feasible or practical
  },
)
