migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('role')) {
      users.fields.add(new SelectField({ name: 'role', values: ['admin', 'mentee'], maxSelect: 1 }))
    }
    if (!users.fields.getByName('plan')) {
      users.fields.add(
        new SelectField({ name: 'plan', values: ['básico', 'premium', 'vip'], maxSelect: 1 }),
      )
    }
    if (!users.fields.getByName('name')) {
      users.fields.add(new TextField({ name: 'name' }))
    }

    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.role = 'admin'"
    users.updateRule = "@request.auth.id = id || @request.auth.role = 'admin'"
    users.deleteRule = "@request.auth.role = 'admin'"
    users.manageRule = "@request.auth.role = 'admin'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) users.fields.removeById(roleField.id)
    const planField = users.fields.getByName('plan')
    if (planField) users.fields.removeById(planField.id)
    app.save(users)
  },
)
