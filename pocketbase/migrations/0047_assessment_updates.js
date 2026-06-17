migrate(
  (app) => {
    const linksCol = app.findCollectionByNameOrId('v1_assessment_links')

    if (!linksCol.fields.getByName('diagnostic_id')) {
      linksCol.fields.add(
        new RelationField({
          name: 'diagnostic_id',
          collectionId: app.findCollectionByNameOrId('v1_saas_diagnostics').id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
      app.save(linksCol)
    }

    const respostasCol = app.findCollectionByNameOrId('v1_assessment_respostas')
    respostasCol.createRule = ''
    app.save(respostasCol)
  },
  (app) => {
    const linksCol = app.findCollectionByNameOrId('v1_assessment_links')
    linksCol.fields.removeByName('diagnostic_id')
    app.save(linksCol)

    const respostasCol = app.findCollectionByNameOrId('v1_assessment_respostas')
    respostasCol.createRule = null
    app.save(respostasCol)
  },
)
