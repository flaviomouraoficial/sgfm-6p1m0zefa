routerAdd('POST', '/backend/v1/saas/webhook/mercadopago', (e) => {
  const body = e.requestInfo().body || {}
  let purchaseId = body.purchase_id

  // Real Mercado Pago Webhook Validation
  if (body.type === 'payment' && body.data && body.data.id) {
    const mpToken = $secrets.get('MERCADOPAGO_ACCESS_TOKEN')
    if (mpToken) {
      try {
        const res = $http.send({
          url: `https://api.mercadopago.com/v1/payments/${body.data.id}`,
          method: 'GET',
          headers: { Authorization: 'Bearer ' + mpToken },
        })
        if (res.statusCode === 200 && res.json.status === 'approved') {
          purchaseId = res.json.external_reference
        }
      } catch (err) {
        console.log('Failed to fetch MP payment', err)
      }
    }
  }

  if (!purchaseId) return e.json(200, { received: true })

  try {
    const purchase = $app.findRecordById('v1_saas_credit_purchases', purchaseId)
    if (purchase.getString('status') !== 'concluido') {
      $app.runInTransaction((txApp) => {
        purchase.set('status', 'concluido')
        txApp.save(purchase)

        const u = txApp.findRecordById('users', purchase.getString('client'))
        u.set('balance', (u.getInt('balance') || 0) + purchase.getInt('credits'))
        txApp.save(u)
      })
    }
  } catch (err) {
    console.log('Webhook error:', err.message)
  }

  return e.json(200, { ok: true })
})
