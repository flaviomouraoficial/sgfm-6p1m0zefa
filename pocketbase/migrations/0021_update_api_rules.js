migrate(
  (app) => {
    const adminRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'"

    const updateRules = (colName, rules) => {
      try {
        const col = app.findCollectionByNameOrId(colName)
        if (rules.list !== undefined) col.listRule = rules.list
        if (rules.view !== undefined) col.viewRule = rules.view
        if (rules.create !== undefined) col.createRule = rules.create
        if (rules.update !== undefined) col.updateRule = rules.update
        if (rules.delete !== undefined) col.deleteRule = rules.delete
        app.save(col)
      } catch (_) {}
    }

    updateRules('users', {
      list: `${adminRule} || id = @request.auth.id`,
      view: `${adminRule} || id = @request.auth.id`,
    })

    updateRules('v1_clientes', {
      list: adminRule,
      view: adminRule,
      create: adminRule,
      update: adminRule,
      delete: adminRule,
    })

    updateRules('v1_deals', {
      list: adminRule,
      view: adminRule,
      create: adminRule,
      update: adminRule,
      delete: adminRule,
    })

    updateRules('v1_transactions', {
      list: adminRule,
      view: adminRule,
      create: adminRule,
      update: adminRule,
      delete: adminRule,
    })

    updateRules('v1_mentees', {
      list: `${adminRule} || email = @request.auth.email`,
      view: `${adminRule} || email = @request.auth.email`,
      create: adminRule,
      update: adminRule,
      delete: adminRule,
    })

    updateRules('v1_proposals', {
      list: adminRule,
      view: adminRule,
      create: adminRule,
      update: adminRule,
      delete: adminRule,
    })

    updateRules('v1_sessoes', {
      list: `${adminRule} || mentee_id.email = @request.auth.email`,
      view: `${adminRule} || mentee_id.email = @request.auth.email`,
      create: adminRule,
      update: adminRule,
      delete: adminRule,
    })

    updateRules('v1_agendamentos', {
      list: `@request.auth.id != ''`,
      view: `@request.auth.id != ''`,
      create: ``,
      update: adminRule,
      delete: adminRule,
    })

    updateRules('v1_time_slots', {
      list: ``,
      view: ``,
      create: adminRule,
      update: ``,
      delete: adminRule,
    })
  },
  (app) => {},
)
