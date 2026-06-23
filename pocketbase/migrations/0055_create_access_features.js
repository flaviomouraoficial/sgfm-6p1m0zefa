migrate(
  (app) => {
    const profiles = new Collection({
      name: 'v1_access_profiles',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'permissions', type: 'json', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(profiles)

    const logs = new Collection({
      name: 'v1_access_logs',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'target_user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
        },
        { name: 'admin_id', type: 'relation', required: false, collectionId: '_pb_users_auth_' },
        { name: 'old_permissions', type: 'json', required: false },
        { name: 'new_permissions', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(logs)

    const notifications = new Collection({
      name: 'v1_notifications',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: null,
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_' },
        { name: 'title', type: 'text', required: true },
        { name: 'message', type: 'text', required: true },
        { name: 'is_read', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_notifications_user ON v1_notifications (user_id)'],
    })
    app.save(notifications)

    try {
      const profileBasi = new Record(profiles)
      profileBasi.set('name', 'Perfil Básico')
      profileBasi.set('permissions', { agenda: true, links: false, credits: false, reports: false })
      app.save(profileBasi)

      const profileInt = new Record(profiles)
      profileInt.set('name', 'Perfil Intermediário')
      profileInt.set('permissions', { agenda: true, reports: true, links: false, credits: false })
      app.save(profileInt)

      const profilePre = new Record(profiles)
      profilePre.set('name', 'Perfil Premium')
      profilePre.set('permissions', { agenda: true, reports: true, links: true, credits: true })
      app.save(profilePre)
    } catch (err) {
      console.log('Error seeding profiles', err)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('v1_notifications'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('v1_access_logs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('v1_access_profiles'))
    } catch (_) {}
  },
)
