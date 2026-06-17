migrate(
  (app) => {
    const packages = [
      { name: 'Start', credits: 5, price: 5.0 },
      { name: 'Pacote Básico', credits: 5, price: 99.0 },
      { name: 'Iniciante', credits: 10, price: 99.9 },
      { name: 'Pacote Profissional', credits: 20, price: 350.0 },
      { name: 'Profissional', credits: 50, price: 399.9 },
      { name: 'Corporativo', credits: 200, price: 1299.9 },
      { name: 'Pacote Enterprise', credits: 100, price: 1500.0 },
    ]

    const col = app.findCollectionByNameOrId('v1_saas_credit_packages')

    packages.forEach((pkg) => {
      try {
        app.findFirstRecordByData('v1_saas_credit_packages', 'name', pkg.name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', pkg.name)
        record.set('credits', pkg.credits)
        record.set('price', pkg.price)
        record.set('active', true)
        app.save(record)
      }
    })
  },
  (app) => {
    // Not removing seeded packages to be safe
  },
)
