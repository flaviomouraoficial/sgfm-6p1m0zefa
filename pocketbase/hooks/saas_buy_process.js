routerAdd(
  'POST',
  '/backend/v1/saas/buy-process',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body || {}
    const pkgId = body.package_id
    if (!pkgId) return e.badRequestError('package_id required')

    const mpToken =
      $secrets.get('MERCADO_PAGO_ACCESS_TOKEN') || $secrets.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!mpToken) return e.internalServerError('Mercado Pago token não configurado.')

    const pkg = $app.findRecordById('v1_saas_credit_packages', pkgId)
    const credits = pkg.getFloat('credits')
    const price = pkg.getFloat('price')

    const purCol = $app.findCollectionByNameOrId('v1_saas_credit_purchases')
    const purchase = new Record(purCol)
    purchase.set('client', userId)
    purchase.set('package', pkgId)
    purchase.set('credits', credits)
    purchase.set('price_paid', price)
    purchase.set('status', 'pendente')
    $app.save(purchase)

    const baseUrl = $secrets.get('SITE_URL') || 'https://' + e.request.host
    const redirectUrl = baseUrl + '/saas/credits'

    const prefBody = {
      items: [
        {
          title: pkg.getString('name'),
          description: pkg.getString('description') || 'Pacote de Créditos SaaS',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price,
        },
      ],
      external_reference: purchase.id,
      back_urls: {
        success: redirectUrl,
        failure: redirectUrl,
        pending: redirectUrl,
      },
      auto_return: 'approved',
    }

    try {
      const res = $http.send({
        url: 'https://api.mercadopago.com/checkout/preferences',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + mpToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prefBody),
      })

      if (res.statusCode >= 300) {
        console.log('MP Error:', res.json || res.body)
        purchase.set('status', 'cancelado')
        $app.save(purchase)
        return e.internalServerError('Erro ao criar preferência de pagamento.')
      }

      return e.json(200, { payment_url: res.json.init_point })
    } catch (err) {
      console.log('MP Catch Error:', err.message)
      return e.internalServerError('Erro ao comunicar com o gateway de pagamento.')
    }
  },
  $apis.requireAuth(),
)
