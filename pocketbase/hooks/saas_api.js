routerAdd(
  'POST',
  '/backend/v1/saas/start',
  (e) => {
    const body = e.requestInfo().body || {}
    const diagnosticId = body.diagnostic_id
    if (!diagnosticId) return e.badRequestError('diagnostic_id required')
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    return $app.runInTransaction((txApp) => {
      const user = txApp.findRecordById('users', userId)
      const diagnostic = txApp.findRecordById('v1_saas_diagnostics', diagnosticId)
      const balance = user.getInt('balance')
      const cost = diagnostic.getInt('cost')
      if (balance < cost) return e.badRequestError('Saldo insuficiente')

      user.set('balance', balance - cost)
      txApp.save(user)

      const resultsCol = txApp.findCollectionByNameOrId('v1_saas_results')
      const result = new Record(resultsCol)
      result.set('client', userId)
      result.set('diagnostic', diagnosticId)
      result.set('status', 'em_progresso')
      result.set('credits_consumed', cost)
      result.set('started_at', new Date().toISOString())
      result.set('type', diagnostic.getString('type'))
      txApp.save(result)

      return e.json(200, { result_id: result.id })
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/saas/cancel',
  (e) => {
    const body = e.requestInfo().body || {}
    const resultId = body.result_id
    if (!resultId) return e.badRequestError('result_id required')
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    return $app.runInTransaction((txApp) => {
      const result = txApp.findRecordById('v1_saas_results', resultId)
      if (result.getString('client') !== userId) return e.forbiddenError('Not yours')
      if (result.getString('status') !== 'em_progresso')
        return e.badRequestError('Must be in progress')

      const cost = result.getInt('credits_consumed')
      const user = txApp.findRecordById('users', userId)
      user.set('balance', user.getInt('balance') + cost)
      txApp.save(user)

      result.set('status', 'cancelado')
      txApp.save(result)
      return e.json(200, { success: true })
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/saas/buy',
  (e) => {
    const body = e.requestInfo().body || {}
    const packageId = body.package_id
    if (!packageId) return e.badRequestError('package_id required')
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    return $app.runInTransaction((txApp) => {
      const pkg = txApp.findRecordById('v1_saas_credit_packages', packageId)
      const credits = pkg.getInt('credits')
      const price = pkg.getInt('price')

      const purchasesCol = txApp.findCollectionByNameOrId('v1_saas_credit_purchases')
      const purchase = new Record(purchasesCol)
      purchase.set('client', userId)
      purchase.set('package', packageId)
      purchase.set('credits', credits)
      purchase.set('price_paid', price)
      purchase.set('status', 'concluido')
      txApp.save(purchase)

      const user = txApp.findRecordById('users', userId)
      user.set('balance', user.getInt('balance') + credits)
      txApp.save(user)
      return e.json(200, { success: true, new_balance: user.getInt('balance') })
    })
  },
  $apis.requireAuth(),
)
