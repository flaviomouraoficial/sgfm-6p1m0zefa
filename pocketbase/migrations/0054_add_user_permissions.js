migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Add permissions JSON field
    users.fields.add(
      new JSONField({
        name: 'permissions',
        required: false,
      }),
    )

    app.save(users)

    // Set default permissions for existing users
    app
      .db()
      .newQuery(`
    UPDATE users 
    SET permissions = '{"links":true,"agenda":true,"credits":true,"reports":true}'
    WHERE permissions IS NULL OR permissions = ''
  `)
      .execute()
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('permissions')
    app.save(users)
  },
)
