migrate(
  (app) => {
    const servicosCol = new Collection({
      name: 'v1_settings_servicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(servicosCol)

    const categoriasCol = new Collection({
      name: 'v1_settings_categorias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          values: ['Receita', 'Despesa'],
          maxSelect: 1,
          required: true,
        },
        { name: 'cor', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(categoriasCol)

    try {
      const settingsRecords = app.findRecordsByFilter('settings_store', '1=1', '', 1, 0)
      if (settingsRecords && settingsRecords.length > 0) {
        const data = settingsRecords[0].get('data') || {}

        if (data.services && Array.isArray(data.services)) {
          for (const svc of data.services) {
            if (!svc || typeof svc !== 'string') continue
            try {
              app.findFirstRecordByData('v1_settings_servicos', 'nome', svc)
            } catch (_) {
              const rec = new Record(servicosCol)
              rec.set('nome', svc)
              rec.set('ativo', true)
              app.save(rec)
            }
          }
        }

        if (data.expenseCategories && Array.isArray(data.expenseCategories)) {
          for (const cat of data.expenseCategories) {
            if (!cat || typeof cat !== 'string') continue
            try {
              app.findFirstRecordByData('v1_settings_categorias', 'nome', cat)
            } catch (_) {
              const rec = new Record(categoriasCol)
              rec.set('nome', cat)
              rec.set('tipo', 'Despesa')
              app.save(rec)
            }
          }
        }

        if (data.services && Array.isArray(data.services)) {
          for (const svc of data.services) {
            if (!svc || typeof svc !== 'string') continue
            try {
              app.findFirstRecordByData('v1_settings_categorias', 'nome', svc)
            } catch (_) {
              const rec = new Record(categoriasCol)
              rec.set('nome', svc)
              rec.set('tipo', 'Receita')
              app.save(rec)
            }
          }
        }
      }
    } catch (err) {
      console.log('Static list migration: no settings_store data found or error:', err.message)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('v1_settings_servicos'))
    } catch (e) {}
    try {
      app.delete(app.findCollectionByNameOrId('v1_settings_categorias'))
    } catch (e) {}
  },
)
