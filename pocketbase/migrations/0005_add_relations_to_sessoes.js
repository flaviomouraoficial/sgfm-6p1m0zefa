migrate(
  (app) => {
    const sessoes = app.findCollectionByNameOrId('v1_sessoes')

    if (!sessoes.fields.getByName('mentee_id')) {
      sessoes.fields.add(
        new RelationField({
          name: 'mentee_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('v1_mentees').id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }

    if (!sessoes.fields.getByName('client_id')) {
      sessoes.fields.add(
        new RelationField({
          name: 'client_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('v1_clientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }

    if (!sessoes.fields.getByName('status')) {
      sessoes.fields.add(new TextField({ name: 'status' }))
    }

    if (!sessoes.fields.getByName('discussion')) {
      sessoes.fields.add(new TextField({ name: 'discussion' }))
    }

    if (!sessoes.fields.getByName('tasks')) {
      sessoes.fields.add(new TextField({ name: 'tasks' }))
    }

    app.save(sessoes)

    const mentees = app.findCollectionByNameOrId('v1_mentees')
    if (!mentees.fields.getByName('emailLogs')) {
      mentees.fields.add(new JSONField({ name: 'emailLogs' }))
    }

    app.save(mentees)
  },
  (app) => {
    const sessoes = app.findCollectionByNameOrId('v1_sessoes')
    sessoes.fields.removeByName('mentee_id')
    sessoes.fields.removeByName('client_id')
    sessoes.fields.removeByName('status')
    sessoes.fields.removeByName('discussion')
    sessoes.fields.removeByName('tasks')
    app.save(sessoes)

    const mentees = app.findCollectionByNameOrId('v1_mentees')
    mentees.fields.removeByName('emailLogs')
    app.save(mentees)
  },
)
