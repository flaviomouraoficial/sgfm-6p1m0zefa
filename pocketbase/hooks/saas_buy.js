routerAdd(
  'POST',
  '/backend/v1/saas/buy',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body || {}
    const pkgId = body.package_id
    if (!pkgId) return e.badRequestError('package_id required')

    const pkg = $app.findRecordById('v1_saas_credit_packages', pkgId)
    const credits = pkg.getFloat('credits')
    const price = pkg.getFloat('price')

    const user = $app.findRecordById('users', userId)
    user.set('balance', (user.getFloat('balance') || 0) + credits)
    $app.save(user)

    const purCol = $app.findCollectionByNameOrId('v1_saas_credit_purchases')
    const purchase = new Record(purCol)
    purchase.set('client', userId)
    purchase.set('package', pkgId)
    purchase.set('credits', credits)
    purchase.set('price_paid', price)
    purchase.set('status', 'concluido')
    $app.save(purchase)

    return e.json(200, { success: true, balance: user.getFloat('balance') })
  },
  $apis.requireAuth(),
)
