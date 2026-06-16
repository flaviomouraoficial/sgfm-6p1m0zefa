// @deps
routerAdd(
  'POST',
  '/backend/v1/saas/buy',
  (e) => {
    const body = e.requestInfo().body
    if (!body.package_id) return e.badRequestError('package_id is required')

    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const pkg = $app.findRecordById('v1_saas_credit_packages', body.package_id)
    if (!pkg.getBool('active')) return e.badRequestError('Pacote inativo')

    const credits = pkg.getFloat('credits')
    const price = pkg.getFloat('price')

    return $app.runInTransaction((txApp) => {
      const purchaseCol = txApp.findCollectionByNameOrId('v1_saas_credit_purchases')
      const purchase = new Record(purchaseCol)
      purchase.set('client', userId)
      purchase.set('package', pkg.id)
      purchase.set('credits', credits)
      purchase.set('price_paid', price)
      purchase.set('status', 'concluido')
      txApp.save(purchase)

      const user = txApp.findRecordById('users', userId)
      user.set('balance', user.getFloat('balance') + credits)
      txApp.save(user)

      return e.json(200, { success: true, balance: user.getFloat('balance') })
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/saas/start',
  (e) => {
    const body = e.requestInfo().body
    if (!body.diagnostic_id) return e.badRequestError('diagnostic_id is required')

    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    return $app.runInTransaction((txApp) => {
      const diag = txApp.findRecordById('v1_saas_diagnostics', body.diagnostic_id)
      const cost = diag.getFloat('cost')
      const user = txApp.findRecordById('users', userId)

      if (user.getFloat('balance') < cost) {
        throw new BadRequestError('Saldo Insuficiente')
      }

      user.set('balance', user.getFloat('balance') - cost)
      txApp.save(user)

      const resultCol = txApp.findCollectionByNameOrId('v1_saas_results')
      const result = new Record(resultCol)
      result.set('client', userId)
      result.set('diagnostic', diag.id)
      result.set('status', 'em_progresso')
      result.set('credits_consumed', cost)
      result.set('started_at', new Date().toISOString())
      result.set('type', diag.getString('type'))
      txApp.save(result)

      return e.json(200, { success: true, id: result.id })
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/saas/cancel/{id}',
  (e) => {
    const resultId = e.request.pathValue('id')
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    return $app.runInTransaction((txApp) => {
      const result = txApp.findRecordById('v1_saas_results', resultId)
      if (result.getString('client') !== userId && !e.hasSuperuserAuth()) {
        throw new ForbiddenError('Acesso negado')
      }
      if (result.getString('status') !== 'em_progresso') {
        throw new BadRequestError('Apenas diagnósticos em progresso podem ser cancelados')
      }

      result.set('status', 'cancelado')
      txApp.save(result)

      const cost = result.getFloat('credits_consumed')
      const user = txApp.findRecordById('users', result.getString('client'))
      user.set('balance', user.getFloat('balance') + cost)
      txApp.save(user)

      return e.json(200, { success: true })
    })
  },
  $apis.requireAuth(),
)
