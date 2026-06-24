migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_saas_credit_purchases')

    const pkgField = col.fields.getByName('package')
    if (pkgField) {
      pkgField.required = false
    }

    if (!col.fields.getByName('notes')) {
      col.fields.add(new TextField({ name: 'notes' }))
    }

    if (!col.fields.getByName('granted_by')) {
      col.fields.add(
        new RelationField({
          name: 'granted_by',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_saas_credit_purchases')

    const pkgField = col.fields.getByName('package')
    if (pkgField) {
      pkgField.required = true
    }

    col.fields.removeByName('notes')
    col.fields.removeByName('granted_by')

    app.save(col)
  },
)
