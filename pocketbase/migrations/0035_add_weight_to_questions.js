migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_assessment_questions')

    if (!col.fields.getByName('weight')) {
      col.fields.add(new NumberField({ name: 'weight', required: false }))
    }

    const rule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'"
    col.createRule = rule
    col.updateRule = rule
    col.deleteRule = rule
    app.save(col)

    app
      .db()
      .newQuery('UPDATE v1_assessment_questions SET weight = 1 WHERE weight IS NULL OR weight <= 0')
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_assessment_questions')
    col.fields.removeByName('weight')

    col.createRule = "@request.auth.role = 'admin'"
    col.updateRule = "@request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
