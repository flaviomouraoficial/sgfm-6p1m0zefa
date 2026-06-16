migrate((app) => {
  const users = app.findCollectionByNameOrId('users')

  // Seed admin user
  try {
    app.findAuthRecordByEmail('users', 'admin@trendconsultoria.com.br')
  } catch (_) {
    const admin = new Record(users)
    admin.setEmail('admin@trendconsultoria.com.br')
    admin.setPassword('Skip@Pass123')
    admin.setVerified(true)
    admin.set('name', 'Admin Trend')
    admin.set('role', 'admin')
    app.save(admin)
  }

  // Seed packages
  const packagesData = [
    { name: 'Start', credits: 5, price: 5.0 },
    { name: 'Pacote Básico', credits: 5, price: 99.0 },
    { name: 'Iniciante', credits: 10, price: 99.9 },
    { name: 'Pacote Profissional', credits: 20, price: 350.0 },
    { name: 'Profissional', credits: 50, price: 399.9 },
    { name: 'Corporativo', credits: 200, price: 1299.9 },
    { name: 'Pacote Enterprise', credits: 100, price: 1500.0 },
  ]
  const pkgCol = app.findCollectionByNameOrId('v1_saas_credit_packages')
  for (const p of packagesData) {
    try {
      app.findFirstRecordByData('v1_saas_credit_packages', 'name', p.name)
    } catch (_) {
      const rec = new Record(pkgCol)
      rec.set('name', p.name)
      rec.set('credits', p.credits)
      rec.set('price', p.price)
      rec.set('active', true)
      app.save(rec)
    }
  }

  // Seed Diagnostics
  const diags = [
    {
      title: 'PRISMA 360',
      cost: 10,
      type: 'prisma',
      description:
        'Avaliação 360° para executivos focada em execução, relacionamento, comportamento e potencial.',
    },
    {
      title: 'Diagnóstico de Gestão',
      cost: 5,
      type: 'gestao',
      description: 'Visão global de maturidade nos pilares organizacionais e operacionais.',
    },
    {
      title: 'Strategic 360°',
      cost: 15,
      type: 'strategic_360',
      description: 'Avaliação estratégica avançada de liderança e impacto em resultados.',
    },
  ]
  const diagCol = app.findCollectionByNameOrId('v1_saas_diagnostics')
  for (const d of diags) {
    try {
      app.findFirstRecordByData('v1_saas_diagnostics', 'title', d.title)
    } catch (_) {
      const rec = new Record(diagCol)
      rec.set('title', d.title)
      rec.set('cost', d.cost)
      rec.set('type', d.type)
      rec.set('description', d.description)
      app.save(rec)
    }
  }

  // Seed Clients
  const sampleClients = [
    { email: 'cliente1@example.com', name: 'Empresa Exemplo SA' },
    { email: 'cliente2@example.com', name: 'Indústria Beta' },
    { email: 'cliente3@example.com', name: 'Serviços Gama' },
  ]
  for (const c of sampleClients) {
    try {
      app.findAuthRecordByEmail('users', c.email)
    } catch (_) {
      const rec = new Record(users)
      rec.setEmail(c.email)
      rec.setPassword('Skip@Pass')
      rec.setVerified(true)
      rec.set('name', c.name)
      rec.set('role', 'client')
      rec.set('balance', 50)
      app.save(rec)
    }
  }
})
