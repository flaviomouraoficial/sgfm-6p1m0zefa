migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')

    if (!col.fields.getByName('amount_bruto')) {
      col.fields.add(new NumberField({ name: 'amount_bruto' }))
    }
    if (!col.fields.getByName('iva_percent')) {
      col.fields.add(new NumberField({ name: 'iva_percent' }))
    }
    if (!col.fields.getByName('iva_amount')) {
      col.fields.add(new NumberField({ name: 'iva_amount' }))
    }
    if (!col.fields.getByName('amount_net')) {
      col.fields.add(new NumberField({ name: 'amount_net' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')

    if (col.fields.getByName('amount_bruto')) col.fields.removeByName('amount_bruto')
    if (col.fields.getByName('iva_percent')) col.fields.removeByName('iva_percent')
    if (col.fields.getByName('iva_amount')) col.fields.removeByName('iva_amount')
    if (col.fields.getByName('amount_net')) col.fields.removeByName('amount_net')

    app.save(col)
  },
)
