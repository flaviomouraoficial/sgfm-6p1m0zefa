migrate(
  (app) => {
    const adminRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || @request.auth.email = 'admin@grupoflaviomoura.com.br'"

    // 1. Atualizar campos na coleção users para 2FA
    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('two_factor_enabled')) {
      usersCol.fields.add(
        new BoolField({
          name: 'two_factor_enabled',
          required: false,
        }),
      )
    }
    if (!usersCol.fields.getByName('two_factor_secret')) {
      usersCol.fields.add(
        new TextField({
          name: 'two_factor_secret',
          required: false,
        }),
      )
    }
    app.save(usersCol)

    // 2. Adicionar campos LGPD em v1_clientes e v1_contatos
    const clientesCol = app.findCollectionByNameOrId('v1_clientes')
    if (!clientesCol.fields.getByName('lgpd_consent')) {
      clientesCol.fields.add(new BoolField({ name: 'lgpd_consent', required: false }))
    }
    if (!clientesCol.fields.getByName('lgpd_consent_date')) {
      clientesCol.fields.add(new DateField({ name: 'lgpd_consent_date', required: false }))
    }
    app.save(clientesCol)

    const contatosCol = app.findCollectionByNameOrId('v1_contatos')
    if (!contatosCol.fields.getByName('lgpd_consent')) {
      contatosCol.fields.add(new BoolField({ name: 'lgpd_consent', required: false }))
    }
    if (!contatosCol.fields.getByName('lgpd_consent_date')) {
      contatosCol.fields.add(new DateField({ name: 'lgpd_consent_date', required: false }))
    }
    app.save(contatosCol)

    // 3. Criar coleção v1_transaction_audits
    let auditsCol
    try {
      auditsCol = app.findCollectionByNameOrId('v1_transaction_audits')
    } catch (_) {
      auditsCol = new Collection({
        name: 'v1_transaction_audits',
        type: 'base',
        listRule: adminRule + ' || @request.auth.permissions.financeiro.ver_transacoes = true',
        viewRule: adminRule + ' || @request.auth.permissions.financeiro.ver_transacoes = true',
        createRule: "@request.auth.id != ''",
        updateRule: adminRule,
        deleteRule: adminRule,
        fields: [
          {
            name: 'transaction_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('v1_transactions').id,
            required: false,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'user_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: false,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'user_name', type: 'text', required: false },
          { name: 'user_email', type: 'text', required: false },
          {
            name: 'action',
            type: 'select',
            values: ['create', 'update', 'delete'],
            maxSelect: 1,
            required: true,
          },
          { name: 'field_changed', type: 'text', required: false },
          { name: 'old_value', type: 'text', required: false },
          { name: 'new_value', type: 'text', required: false },
          { name: 'details', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_tx_audit_txid ON v1_transaction_audits (transaction_id)',
          'CREATE INDEX idx_tx_audit_created ON v1_transaction_audits (created DESC)',
        ],
      })
      app.save(auditsCol)
    }

    // 4. Reforçar regras de acesso (API Rules) em todas as collections de negócio e configuração
    // v1_transactions
    const txCol = app.findCollectionByNameOrId('v1_transactions')
    txCol.listRule = adminRule + ' || @request.auth.permissions.financeiro.ver_transacoes = true'
    txCol.viewRule = adminRule + ' || @request.auth.permissions.financeiro.ver_transacoes = true'
    txCol.createRule = adminRule + ' || @request.auth.permissions.financeiro.criar_editar = true'
    txCol.updateRule = adminRule + ' || @request.auth.permissions.financeiro.criar_editar = true'
    txCol.deleteRule = adminRule
    app.save(txCol)

    // v1_deals
    const dealsCol = app.findCollectionByNameOrId('v1_deals')
    dealsCol.listRule = adminRule + ' || @request.auth.permissions.crm.ver_funil = true'
    dealsCol.viewRule = adminRule + ' || @request.auth.permissions.crm.ver_funil = true'
    dealsCol.createRule = adminRule + ' || @request.auth.permissions.crm.criar_editar_deals = true'
    dealsCol.updateRule = adminRule + ' || @request.auth.permissions.crm.criar_editar_deals = true'
    dealsCol.deleteRule = adminRule
    app.save(dealsCol)

    // v1_proposals
    const proposalsCol = app.findCollectionByNameOrId('v1_proposals')
    proposalsCol.listRule = adminRule + ' || @request.auth.permissions.crm.propostas = true'
    proposalsCol.viewRule = adminRule + ' || @request.auth.permissions.crm.propostas = true'
    proposalsCol.createRule = adminRule + ' || @request.auth.permissions.crm.propostas = true'
    proposalsCol.updateRule = adminRule + ' || @request.auth.permissions.crm.propostas = true'
    proposalsCol.deleteRule = adminRule
    app.save(proposalsCol)

    // v1_clientes (admin/permissão vê tudo; mentorando vê se for cliente)
    const clientes = app.findCollectionByNameOrId('v1_clientes')
    clientes.listRule =
      adminRule + ' || @request.auth.permissions.crm.clientes = true || email = @request.auth.email'
    clientes.viewRule =
      adminRule + ' || @request.auth.permissions.crm.clientes = true || email = @request.auth.email'
    clientes.createRule = adminRule + ' || @request.auth.permissions.crm.clientes = true'
    clientes.updateRule = adminRule + ' || @request.auth.permissions.crm.clientes = true'
    clientes.deleteRule = adminRule
    app.save(clientes)

    // v1_contatos
    const contatos = app.findCollectionByNameOrId('v1_contatos')
    contatos.listRule = adminRule + ' || @request.auth.permissions.crm.clientes = true'
    contatos.viewRule = adminRule + ' || @request.auth.permissions.crm.clientes = true'
    contatos.createRule = adminRule + ' || @request.auth.permissions.crm.clientes = true'
    contatos.updateRule = adminRule + ' || @request.auth.permissions.crm.clientes = true'
    contatos.deleteRule = adminRule
    app.save(contatos)

    // v1_reunioes_comerciais
    const reunioes = app.findCollectionByNameOrId('v1_reunioes_comerciais')
    reunioes.listRule = adminRule + ' || @request.auth.permissions.crm.ver_funil = true'
    reunioes.viewRule = adminRule + ' || @request.auth.permissions.crm.ver_funil = true'
    reunioes.createRule = adminRule + ' || @request.auth.permissions.crm.criar_editar_deals = true'
    reunioes.updateRule = adminRule + ' || @request.auth.permissions.crm.criar_editar_deals = true'
    reunioes.deleteRule = adminRule
    app.save(reunioes)

    // v1_mentees (admin/permissão vê todos; mentorando só vê a si mesmo por email)
    const menteesCol = app.findCollectionByNameOrId('v1_mentees')
    menteesCol.listRule =
      adminRule +
      ' || @request.auth.permissions.mentoria.ver_mentorados = true || email = @request.auth.email'
    menteesCol.viewRule =
      adminRule +
      ' || @request.auth.permissions.mentoria.ver_mentorados = true || email = @request.auth.email'
    menteesCol.createRule =
      adminRule + ' || @request.auth.permissions.mentoria.ver_mentorados = true'
    menteesCol.updateRule =
      adminRule + ' || @request.auth.permissions.mentoria.ver_mentorados = true'
    menteesCol.deleteRule = adminRule
    app.save(menteesCol)

    // v1_sessoes (admin/permissão vê; mentorando só vê as próprias)
    const sessoesCol = app.findCollectionByNameOrId('v1_sessoes')
    sessoesCol.listRule =
      adminRule +
      ' || @request.auth.permissions.mentoria.sessoes = true || mentee_id.email = @request.auth.email'
    sessoesCol.viewRule =
      adminRule +
      ' || @request.auth.permissions.mentoria.sessoes = true || mentee_id.email = @request.auth.email'
    sessoesCol.createRule = adminRule + ' || @request.auth.permissions.mentoria.sessoes = true'
    sessoesCol.updateRule = adminRule + ' || @request.auth.permissions.mentoria.sessoes = true'
    sessoesCol.deleteRule = adminRule
    app.save(sessoesCol)

    // v1_agendamentos (mentorando só vê os próprios)
    const agendamentosCol = app.findCollectionByNameOrId('v1_agendamentos')
    agendamentosCol.listRule =
      adminRule +
      ' || @request.auth.permissions.mentoria.agenda = true || cliente_email = @request.auth.email || mentee_id.email = @request.auth.email'
    agendamentosCol.viewRule =
      adminRule +
      ' || @request.auth.permissions.mentoria.agenda = true || cliente_email = @request.auth.email || mentee_id.email = @request.auth.email'
    agendamentosCol.createRule = "@request.auth.id != '' || cliente_nome != ''"
    agendamentosCol.updateRule = adminRule + ' || @request.auth.permissions.mentoria.agenda = true'
    agendamentosCol.deleteRule = adminRule + ' || @request.auth.permissions.mentoria.agenda = true'
    app.save(agendamentosCol)

    // Configurações globais: somente-leitura para não-admin
    const settingsStore = app.findCollectionByNameOrId('settings_store')
    settingsStore.listRule = "@request.auth.id != ''"
    settingsStore.viewRule = "@request.auth.id != ''"
    settingsStore.createRule = adminRule
    settingsStore.updateRule = adminRule
    settingsStore.deleteRule = adminRule
    app.save(settingsStore)

    const settingsCategorias = app.findCollectionByNameOrId('v1_settings_categorias')
    settingsCategorias.listRule = "@request.auth.id != ''"
    settingsCategorias.viewRule = "@request.auth.id != ''"
    settingsCategorias.createRule = adminRule
    settingsCategorias.updateRule = adminRule
    settingsCategorias.deleteRule = adminRule
    app.save(settingsCategorias)

    const settingsServicos = app.findCollectionByNameOrId('v1_settings_servicos')
    settingsServicos.listRule = "@request.auth.id != ''"
    settingsServicos.viewRule = "@request.auth.id != ''"
    settingsServicos.createRule = adminRule
    settingsServicos.updateRule = adminRule
    settingsServicos.deleteRule = adminRule
    app.save(settingsServicos)

    const contasFinanceiras = app.findCollectionByNameOrId('v1_contas_financeiras')
    contasFinanceiras.listRule = "@request.auth.id != ''"
    contasFinanceiras.viewRule = "@request.auth.id != ''"
    contasFinanceiras.createRule = adminRule
    contasFinanceiras.updateRule = adminRule
    contasFinanceiras.deleteRule = adminRule
    app.save(contasFinanceiras)

    // v1_access_profiles
    const profilesCol = app.findCollectionByNameOrId('v1_access_profiles')
    profilesCol.listRule = adminRule + ' || @request.auth.permissions.admin.perfis_acesso = true'
    profilesCol.viewRule = adminRule + ' || @request.auth.permissions.admin.perfis_acesso = true'
    profilesCol.createRule = adminRule + ' || @request.auth.permissions.admin.perfis_acesso = true'
    profilesCol.updateRule = adminRule + ' || @request.auth.permissions.admin.perfis_acesso = true'
    profilesCol.deleteRule = adminRule + ' || @request.auth.permissions.admin.perfis_acesso = true'
    app.save(profilesCol)

    // v1_access_logs
    const logsCol = app.findCollectionByNameOrId('v1_access_logs')
    logsCol.listRule = adminRule
    logsCol.viewRule = adminRule
    app.save(logsCol)
  },
  (app) => {},
)
