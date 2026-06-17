routerAdd(
  'POST',
  '/backend/v1/saas/buy-process',
  (e) => {
    const body = e.requestInfo().body || {}
    const pkgId = body.package_id
    const user = e.auth

    if (!user) return e.unauthorizedError('Autenticação necessária.')
    if (!pkgId) return e.badRequestError('Pacote não informado.')

    const pkg = $app.findRecordById('v1_saas_credit_packages', pkgId)
    if (!pkg) return e.notFoundError('Pacote não encontrado.')

    // Register the purchase intent
    const collection = $app.findCollectionByNameOrId('v1_saas_credit_purchases')
    const purchase = new Record(collection)
    purchase.set('client', user.id)
    purchase.set('package', pkg.id)
    purchase.set('credits', pkg.getInt('credits'))
    purchase.set('price_paid', pkg.getFloat('price'))
    purchase.set('status', 'pendente')
    $app.save(purchase)

    const mpToken = $secrets.get('MERCADOPAGO_ACCESS_TOKEN') || 'TEST-TOKEN'
    let init_point = ''

    if (mpToken === 'TEST-TOKEN') {
      // Mock mode for testing without real credentials
      init_point = $secrets.get('SITE_URL') + '/dashboard'

      $app.runInTransaction((txApp) => {
        purchase.set('status', 'concluido')
        txApp.save(purchase)

        const u = txApp.findRecordById('users', user.id)
        u.set('balance', (u.getInt('balance') || 0) + pkg.getInt('credits'))
        txApp.save(u)
      })
    } else {
      // Create Mercado Pago Preference
      const res = $http.send({
        url: 'https://api.mercadopago.com/checkout/preferences',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + mpToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: pkg.id,
              title: pkg.getString('name'),
              description: pkg.getString('description') || 'Pacote de Créditos',
              quantity: 1,
              unit_price: pkg.getFloat('price'),
            },
          ],
          external_reference: purchase.id,
          back_urls: {
            success: $secrets.get('SITE_URL') + '/dashboard',
            failure: $secrets.get('SITE_URL') + '/comprar-creditos',
            pending: $secrets.get('SITE_URL') + '/comprar-creditos',
          },
          auto_return: 'approved',
        }),
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        init_point = res.json.init_point
      } else {
        return e.internalServerError(
          'Falha ao integrar com Mercado Pago: ' + JSON.stringify(res.json),
        )
      }
    }

    return e.json(200, { payment_url: init_point, purchase_id: purchase.id })
  },
  $apis.requireAuth(),
)
