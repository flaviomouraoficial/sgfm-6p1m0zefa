routerAdd(
  'POST',
  '/backend/v1/saas/buy',
  (e) => {
    const body = e.requestInfo().body
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Auth required')

    const pkgId = body.package_id
    if (!pkgId) return e.badRequestError('Missing package_id')

    $app.runInTransaction((txApp) => {
      const pkg = txApp.findRecordById('v1_saas_credit_packages', pkgId)
      const credits = pkg.getFloat('credits') || 0

      const col = txApp.findCollectionByNameOrId('v1_saas_credit_purchases')
      const purchase = new Record(col)
      purchase.set('client', userId)
      purchase.set('package', pkg.id)
      purchase.set('credits', credits)
      purchase.set('price_paid', pkg.getFloat('price'))
      purchase.set('status', 'concluido')
      txApp.save(purchase)

      const userTx = txApp.findRecordById('users', userId)
      userTx.set('balance', userTx.getFloat('balance') + credits)
      txApp.save(userTx)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
