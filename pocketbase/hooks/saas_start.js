routerAdd(
  'POST',
  '/backend/v1/saas/start',
  (e) => {
    const body = e.requestInfo().body
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Auth required')

    const diagnosticId = body.diagnostic_id
    if (!diagnosticId) return e.badRequestError('Missing diagnostic_id')

    const diagnostic = $app.findRecordById('v1_saas_diagnostics', diagnosticId)
    const user = $app.findRecordById('users', userId)
    const cost = diagnostic.getFloat('cost') || 0

    if (user.getFloat('balance') < cost) {
      return e.badRequestError('Saldo insuficiente')
    }

    let newResultId = ''
    $app.runInTransaction((txApp) => {
      const userTx = txApp.findRecordById('users', userId)
      userTx.set('balance', userTx.getFloat('balance') - cost)
      txApp.save(userTx)

      const collection = txApp.findCollectionByNameOrId('v1_saas_results')
      const result = new Record(collection)
      result.set('client', userId)
      result.set('diagnostic', diagnostic.id)
      result.set('status', 'em_progresso')
      result.set('credits_consumed', cost)
      result.set('type', diagnostic.getString('type'))
      result.set('started_at', new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z')
      txApp.save(result)
      newResultId = result.id
    })

    return e.json(200, { id: newResultId })
  },
  $apis.requireAuth(),
)
