migrate(
  (app) => {
    const trilhasCol = app.findCollectionByNameOrId('v1_protensora_trilhas')
    if (!trilhasCol.fields.getByName('min_score_certificate')) {
      trilhasCol.fields.add(new NumberField({ name: 'min_score_certificate', min: 0, max: 100 }))
    }
    app.save(trilhasCol)

    // Update existing trilhas
    app
      .db()
      .newQuery(
        'UPDATE v1_protensora_trilhas SET min_score_certificate = 70 WHERE min_score_certificate IS NULL OR min_score_certificate = 0',
      )
      .execute()

    const partCol = app.findCollectionByNameOrId('v1_protensora_participante_trilhas')
    partCol.addIndex('idx_protensora_part_xp_total', false, 'xp_total', '')
    partCol.addIndex('idx_protensora_part_status', false, 'status', '')
    app.save(partCol)
  },
  (app) => {
    try {
      const trilhasCol = app.findCollectionByNameOrId('v1_protensora_trilhas')
      trilhasCol.fields.removeByName('min_score_certificate')
      app.save(trilhasCol)
    } catch (_) {}

    try {
      const partCol = app.findCollectionByNameOrId('v1_protensora_participante_trilhas')
      partCol.removeIndex('idx_protensora_part_xp_total')
      partCol.removeIndex('idx_protensora_part_status')
      app.save(partCol)
    } catch (_) {}
  },
)
