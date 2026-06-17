migrate(
  (app) => {
    const results = app.findCollectionByNameOrId('v1_saas_results')
    if (!results.fields.getByName('consultant_notes')) {
      results.fields.add(new TextField({ name: 'consultant_notes' }))
    }
    app.save(results)

    const links = app.findCollectionByNameOrId('v1_assessment_links')
    if (!links.fields.getByName('result_id')) {
      links.fields.add(
        new RelationField({ name: 'result_id', collectionId: results.id, maxSelect: 1 }),
      )
    }
    if (!links.fields.getByName('link_type')) {
      links.fields.add(
        new SelectField({
          name: 'link_type',
          values: ['estrategico', 'tatico', 'operacional', 'padrao'],
          maxSelect: 1,
        }),
      )
    }
    app.save(links)
  },
  (app) => {
    const results = app.findCollectionByNameOrId('v1_saas_results')
    results.fields.removeByName('consultant_notes')
    app.save(results)

    const links = app.findCollectionByNameOrId('v1_assessment_links')
    links.fields.removeByName('result_id')
    links.fields.removeByName('link_type')
    app.save(links)
  },
)
