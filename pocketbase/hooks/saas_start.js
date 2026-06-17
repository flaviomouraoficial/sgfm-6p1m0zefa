routerAdd(
  'POST',
  '/backend/v1/saas/start',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body || {}
    const diagId = body.diagnostic_id
    if (!diagId) return e.badRequestError('diagnostic_id required')

    const diag = $app.findRecordById('v1_saas_diagnostics', diagId)
    const cost = diag.getFloat('cost')

    const user = $app.findRecordById('users', userId)
    const balance = user.getFloat('balance') || 0

    if (balance < cost) {
      return e.badRequestError('Saldo insuficiente')
    }

    user.set('balance', balance - cost)
    $app.save(user)

    const resCol = $app.findCollectionByNameOrId('v1_saas_results')
    const result = new Record(resCol)
    result.set('client', userId)
    result.set('diagnostic', diagId)
    result.set('type', diag.getString('type'))
    result.set('status', 'em_progresso')
    result.set('credits_consumed', cost)
    result.set('started_at', new Date().toISOString())
    $app.save(result)

    return e.json(200, { id: result.id, balance: user.getFloat('balance') })
  },
  $apis.requireAuth(),
)
