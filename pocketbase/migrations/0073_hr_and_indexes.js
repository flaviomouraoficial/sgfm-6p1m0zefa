migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('cargo')) {
      users.fields.add(new TextField({ name: 'cargo' }))
    }
    if (!users.fields.getByName('data_admissao')) {
      users.fields.add(new DateField({ name: 'data_admissao' }))
    }
    if (!users.fields.getByName('salario_base')) {
      users.fields.add(new NumberField({ name: 'salario_base' }))
    }
    app.save(users)

    try {
      app.findCollectionByNameOrId('v1_rh_ponto')
    } catch (_) {
      const rhPonto = new Collection({
        name: 'v1_rh_ponto',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'admin')",
        viewRule:
          "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.role = 'admin')",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'check_in', type: 'date', required: true },
          { name: 'check_out', type: 'date' },
          { name: 'location', type: 'text' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(rhPonto)
    }

    const deals = app.findCollectionByNameOrId('v1_deals')
    deals.addIndex('idx_deals_stage', false, 'stage', '')
    app.save(deals)

    const tx = app.findCollectionByNameOrId('v1_transactions')
    tx.addIndex('idx_tx_status_type_date', false, 'status, type, date', '')
    app.save(tx)

    const sessoes = app.findCollectionByNameOrId('v1_sessoes')
    sessoes.addIndex('idx_sessoes_status_date', false, 'status, date', '')
    app.save(sessoes)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('cargo')
    users.fields.removeByName('data_admissao')
    users.fields.removeByName('salario_base')
    app.save(users)

    try {
      const rh = app.findCollectionByNameOrId('v1_rh_ponto')
      app.delete(rh)
    } catch (_) {}

    const deals = app.findCollectionByNameOrId('v1_deals')
    deals.removeIndex('idx_deals_stage')
    app.save(deals)

    const tx = app.findCollectionByNameOrId('v1_transactions')
    tx.removeIndex('idx_tx_status_type_date')
    app.save(tx)

    const sessoes = app.findCollectionByNameOrId('v1_sessoes')
    sessoes.removeIndex('idx_sessoes_status_date')
    app.save(sessoes)
  },
)
