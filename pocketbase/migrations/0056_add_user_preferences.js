migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('preferences')) {
      users.fields.add(new JSONField({ name: 'preferences', required: false }))
    }
    app.save(users)

    const notifications = app.findCollectionByNameOrId('v1_notifications')
    notifications.addIndex('idx_notifications_user_read', false, 'user_id, is_read', '')
    app.save(notifications)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('preferences')
    app.save(users)

    const notifications = app.findCollectionByNameOrId('v1_notifications')
    notifications.removeIndex('idx_notifications_user_read')
    app.save(notifications)
  },
)
