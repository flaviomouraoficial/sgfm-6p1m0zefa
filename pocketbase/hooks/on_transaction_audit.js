onRecordAfterCreateSuccess((e) => {
  try {
    const tx = e.record
    const auditsCol = $app.findCollectionByNameOrId('v1_transaction_audits')
    const audit = new Record(auditsCol)

    const auth = e.auth
    const userId = auth ? auth.id : ''
    const userName = auth ? auth.getString('name') || auth.getString('email') : 'Sistema'
    const userEmail = auth ? auth.getString('email') : ''

    audit.set('transaction_id', tx.id)
    if (userId) audit.set('user_id', userId)
    audit.set('user_name', userName)
    audit.set('user_email', userEmail)
    audit.set('action', 'create')
    audit.set('field_changed', 'todas')
    audit.set('old_value', '')
    audit.set(
      'new_value',
      `${tx.getString('description')} | R$ ${tx.getFloat('amount')} | ${tx.getString('type')}`,
    )
    audit.set('details', {
      description: tx.getString('description'),
      amount: tx.getFloat('amount'),
      type: tx.getString('type'),
      status: tx.getString('status'),
      category: tx.getString('category'),
      date: tx.getString('date'),
    })

    $app.save(audit)
  } catch (err) {
    console.log('Error creating transaction audit on create:', err.message)
  }

  return e.next()
}, 'v1_transactions')

onRecordAfterUpdateSuccess((e) => {
  try {
    const tx = e.record
    const orig = tx.original()
    const auditsCol = $app.findCollectionByNameOrId('v1_transaction_audits')

    const auth = e.auth
    const userId = auth ? auth.id : ''
    const userName = auth ? auth.getString('name') || auth.getString('email') : 'Sistema'
    const userEmail = auth ? auth.getString('email') : ''

    const fieldsToCheck = [
      { name: 'amount', label: 'Valor' },
      { name: 'description', label: 'Descrição' },
      { name: 'type', label: 'Tipo' },
      { name: 'status', label: 'Status' },
      { name: 'category', label: 'Categoria' },
      { name: 'date', label: 'Data' },
      { name: 'document_number', label: 'Nº Documento' },
      { name: 'conciliado', label: 'Conciliado' },
      { name: 'conta_id', label: 'Conta Bancária' },
      { name: 'client_id', label: 'Cliente' },
      { name: 'mentee_id', label: 'Mentorando' },
    ]

    const changedDiffs = []

    for (const field of fieldsToCheck) {
      let oldVal = ''
      let newVal = ''

      if (field.name === 'amount') {
        const oNum = orig.getFloat('amount')
        const nNum = tx.getFloat('amount')
        if (Math.abs(oNum - nNum) > 0.001) {
          oldVal = `R$ ${oNum}`
          newVal = `R$ ${nNum}`
          changedDiffs.push({ field: field.label, oldVal, newVal })
        }
      } else if (field.name === 'conciliado') {
        const oBool = orig.getBool('conciliado')
        const nBool = tx.getBool('conciliado')
        if (oBool !== nBool) {
          oldVal = oBool ? 'Sim' : 'Não'
          newVal = nBool ? 'Sim' : 'Não'
          changedDiffs.push({ field: field.label, oldVal, newVal })
        }
      } else {
        const oStr = orig.getString(field.name)
        const nStr = tx.getString(field.name)
        if (oStr !== nStr) {
          oldVal = oStr || '(vazio)'
          newVal = nStr || '(vazio)'
          changedDiffs.push({ field: field.label, oldVal, newVal })
        }
      }
    }

    if (changedDiffs.length > 0) {
      const summaryFields = changedDiffs.map((d) => d.field).join(', ')
      const summaryOld = changedDiffs.map((d) => `${d.field}: ${d.oldVal}`).join(' | ')
      const summaryNew = changedDiffs.map((d) => `${d.field}: ${d.newVal}`).join(' | ')

      const audit = new Record(auditsCol)
      audit.set('transaction_id', tx.id)
      if (userId) audit.set('user_id', userId)
      audit.set('user_name', userName)
      audit.set('user_email', userEmail)
      audit.set('action', 'update')
      audit.set('field_changed', summaryFields)
      audit.set('old_value', summaryOld)
      audit.set('new_value', summaryNew)
      audit.set('details', changedDiffs)

      $app.save(audit)
    }
  } catch (err) {
    console.log('Error creating transaction audit on update:', err.message)
  }

  return e.next()
}, 'v1_transactions')

onRecordAfterDeleteSuccess((e) => {
  try {
    const tx = e.record
    const auditsCol = $app.findCollectionByNameOrId('v1_transaction_audits')

    const auth = e.auth
    const userId = auth ? auth.id : ''
    const userName = auth ? auth.getString('name') || auth.getString('email') : 'Sistema'
    const userEmail = auth ? auth.getString('email') : ''

    const audit = new Record(auditsCol)
    audit.set('transaction_id', tx.id)
    if (userId) audit.set('user_id', userId)
    audit.set('user_name', userName)
    audit.set('user_email', userEmail)
    audit.set('action', 'delete')
    audit.set('field_changed', 'registro_excluido')
    audit.set(
      'old_value',
      `${tx.getString('description')} | R$ ${tx.getFloat('amount')} | ${tx.getString('type')}`,
    )
    audit.set('new_value', 'Excluído')
    audit.set('details', {
      description: tx.getString('description'),
      amount: tx.getFloat('amount'),
      type: tx.getString('type'),
    })

    $app.save(audit)
  } catch (err) {
    console.log('Error creating transaction audit on delete:', err.message)
  }

  return e.next()
}, 'v1_transactions')
