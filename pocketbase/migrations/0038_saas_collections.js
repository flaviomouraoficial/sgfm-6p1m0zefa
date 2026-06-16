migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const roleField = users.fields.getByName('role')
    if (roleField && !roleField.values.includes('client')) {
      roleField.values.push('client')
    }
    if (!users.fields.getByName('balance')) {
      users.fields.add(new NumberField({ name: 'balance', min: 0 }))
    }
    app.save(users)

    const packages = new Collection({
      name: 'v1_saas_credit_packages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'credits', type: 'number', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'description', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(packages)

    const diagnostics = new Collection({
      name: 'v1_saas_diagnostics',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'cost', type: 'number', required: true },
        { name: 'icon', type: 'text' },
        { name: 'description', type: 'text' },
        {
          name: 'type',
          type: 'select',
          values: ['prisma', 'gestao', 'strategic_360'],
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(diagnostics)

    const results = new Collection({
      name: 'v1_saas_results',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || client = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || client = @request.auth.id",
      createRule: "@request.auth.role = 'admin' || client = @request.auth.id",
      updateRule: "@request.auth.role = 'admin' || client = @request.auth.id",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'diagnostic',
          type: 'relation',
          required: true,
          collectionId: diagnostics.id,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Concluído', 'em_progresso', 'cancelado'],
          required: true,
        },
        { name: 'credits_consumed', type: 'number' },
        { name: 'result_json', type: 'json' },
        { name: 'started_at', type: 'date' },
        { name: 'completed_at', type: 'date' },
        { name: 'type', type: 'select', values: ['prisma', 'gestao', 'strategic_360'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(results)

    const purchases = new Collection({
      name: 'v1_saas_credit_purchases',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || client = @request.auth.id",
      viewRule: "@request.auth.role = 'admin' || client = @request.auth.id",
      createRule: "@request.auth.role = 'admin' || client = @request.auth.id",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'package',
          type: 'relation',
          required: true,
          collectionId: packages.id,
          maxSelect: 1,
        },
        { name: 'credits', type: 'number' },
        { name: 'price_paid', type: 'number' },
        { name: 'status', type: 'select', values: ['pendente', 'concluido', 'cancelado'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(purchases)

    const settings = new Collection({
      name: 'v1_saas_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'company_name', type: 'text' },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
        },
        { name: 'report_title', type: 'text' },
        { name: 'contact_email', type: 'text' },
        { name: 'contact_phone', type: 'text' },
        { name: 'report_comments', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(settings)
  },
  (app) => {},
)
