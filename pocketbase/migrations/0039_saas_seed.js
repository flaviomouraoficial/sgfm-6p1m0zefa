migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'admin@trendconsultoria.com.br')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('admin@trendconsultoria.com.br')
      admin.setPassword('admin123')
      admin.setVerified(true)
      admin.set('name', 'Admin Trend')
      admin.set('role', 'admin')
      app.save(admin)
    }

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'cliente@empresa.com.br')
    } catch (_) {
      const client = new Record(users)
      client.setEmail('cliente@empresa.com.br')
      client.setPassword('cliente123')
      client.setVerified(true)
      client.set('name', 'Cliente Teste')
      client.set('role', 'client')
      client.set('balance', 500)
      app.save(client)
    }

    const diagnostics = app.findCollectionByNameOrId('v1_saas_diagnostics')
    try {
      app.findFirstRecordByData('v1_saas_diagnostics', 'type', 'prisma')
    } catch (_) {
      const p = new Record(diagnostics)
      p.set('title', 'Diagnóstico PRISMA')
      p.set('cost', 50)
      p.set('icon', 'Target')
      p.set('description', 'Avaliação de perfil e aderência')
      p.set('type', 'prisma')
      app.save(p)
    }
    try {
      app.findFirstRecordByData('v1_saas_diagnostics', 'type', 'gestao')
    } catch (_) {
      const p = new Record(diagnostics)
      p.set('title', 'Gestão de Negócios')
      p.set('cost', 100)
      p.set('icon', 'Briefcase')
      p.set('description', 'Diagnóstico de maturidade de gestão')
      p.set('type', 'gestao')
      app.save(p)
    }
    try {
      app.findFirstRecordByData('v1_saas_diagnostics', 'type', 'strategic_360')
    } catch (_) {
      const p = new Record(diagnostics)
      p.set('title', 'Strategic 360°')
      p.set('cost', 150)
      p.set('icon', 'PieChart')
      p.set('description', 'Avaliação 360 graus de liderança')
      p.set('type', 'strategic_360')
      app.save(p)
    }

    const packages = app.findCollectionByNameOrId('v1_saas_credit_packages')
    try {
      app.findFirstRecordByData('v1_saas_credit_packages', 'name', 'Pacote Básico')
    } catch (_) {
      const p1 = new Record(packages)
      p1.set('name', 'Pacote Básico')
      p1.set('credits', 100)
      p1.set('price', 500)
      p1.set('active', true)
      app.save(p1)
    }
  },
  (app) => {},
)
