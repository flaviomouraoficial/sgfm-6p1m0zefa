migrate(
  (app) => {
    const patterns = ['teste', 'demo', 'mock', 'fake', 'homolog', 'amostra']

    const targets = [
      {
        collection: 'users',
        cols: ['name', 'email'],
        extraCondition: "IFNULL(role, '') != 'admin'",
      },
      { collection: 'v1_clientes', cols: ['name'] },
      { collection: 'v1_mentees', cols: ['name', 'email'] },
      { collection: 'v1_sessoes', cols: ['notes', 'discussion', 'tasks'] },
      { collection: 'v1_agendamentos', cols: ['cliente_nome', 'cliente_email', 'status'] },
      { collection: 'v1_transactions', cols: ['description', 'category'] },
      { collection: 'v1_time_slots', cols: ['description', 'menteeName'] },
    ]

    for (const target of targets) {
      let colObj
      try {
        colObj = app.findCollectionByNameOrId(target.collection)
      } catch (_) {
        console.log(`Skipping ${target.collection} - collection not found`)
        continue
      }

      const tableName = colObj.name
      const conditions = []
      for (const col of target.cols) {
        for (const pattern of patterns) {
          conditions.push(`LOWER(IFNULL(${col}, '')) LIKE '%${pattern}%'`)
        }
      }

      let whereClause = conditions.join(' OR ')
      if (target.extraCondition) {
        whereClause = `(${whereClause}) AND ${target.extraCondition}`
      }

      try {
        const rows = app.db().newQuery(`SELECT id FROM \`${tableName}\` WHERE ${whereClause}`).all()
        if (rows && rows.length > 0) {
          app.db().newQuery(`DELETE FROM \`${tableName}\` WHERE ${whereClause}`).execute()
          console.log(`Deleted ${rows.length} test records from ${tableName}`)
        } else {
          console.log(`Deleted 0 test records from ${tableName}`)
        }
      } catch (err) {
        console.log(`Error processing ${tableName}: ${err.message}`)
      }
    }

    // Clear cache
    try {
      const cacheCol = app.findCollectionByNameOrId('forecasts_store')
      const tableName = cacheCol.name
      const cacheRows = app.db().newQuery(`SELECT id FROM \`${tableName}\``).all()
      if (cacheRows && cacheRows.length > 0) {
        app.db().newQuery(`DELETE FROM \`${tableName}\``).execute()
        console.log(`Deleted ${cacheRows.length} cache records from forecasts_store`)
      } else {
        console.log(`Deleted 0 cache records from forecasts_store`)
      }
    } catch (err) {
      console.log(`Error clearing forecasts_store: ${err.message}`)
    }
  },
  (app) => {
    console.log('0007_cleanup_test_data down migration: Cannot restore deleted test data')
  },
)
