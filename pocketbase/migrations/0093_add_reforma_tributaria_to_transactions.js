migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')

    if (!col.fields.getByName('emits_fiscal_doc')) {
      col.fields.add(new BoolField({ name: 'emits_fiscal_doc' }))
    }
    if (!col.fields.getByName('fiscal_regime')) {
      col.fields.add(
        new SelectField({
          name: 'fiscal_regime',
          values: ['caixa', 'competencia'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('cbs_aliquota')) {
      col.fields.add(new NumberField({ name: 'cbs_aliquota' }))
    }
    if (!col.fields.getByName('cbs_amount')) {
      col.fields.add(new NumberField({ name: 'cbs_amount' }))
    }
    if (!col.fields.getByName('ibs_aliquota')) {
      col.fields.add(new NumberField({ name: 'ibs_aliquota' }))
    }
    if (!col.fields.getByName('ibs_amount')) {
      col.fields.add(new NumberField({ name: 'ibs_amount' }))
    }
    if (!col.fields.getByName('split_payment_applied')) {
      col.fields.add(new BoolField({ name: 'split_payment_applied' }))
    }
    if (!col.fields.getByName('split_payment_amount')) {
      col.fields.add(new NumberField({ name: 'split_payment_amount' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_transactions')

    if (col.fields.getByName('emits_fiscal_doc')) col.fields.removeByName('emits_fiscal_doc')
    if (col.fields.getByName('fiscal_regime')) col.fields.removeByName('fiscal_regime')
    if (col.fields.getByName('cbs_aliquota')) col.fields.removeByName('cbs_aliquota')
    if (col.fields.getByName('cbs_amount')) col.fields.removeByName('cbs_amount')
    if (col.fields.getByName('ibs_aliquota')) col.fields.removeByName('ibs_aliquota')
    if (col.fields.getByName('ibs_amount')) col.fields.removeByName('ibs_amount')
    if (col.fields.getByName('split_payment_applied'))
      col.fields.removeByName('split_payment_applied')
    if (col.fields.getByName('split_payment_amount'))
      col.fields.removeByName('split_payment_amount')

    app.save(col)
  },
)
