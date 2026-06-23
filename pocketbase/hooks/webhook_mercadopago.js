routerAdd('POST', '/backend/v1/saas/webhook/mercadopago', (e) => {
  const body = e.requestInfo().body || {}

  if (body.type === 'payment' && body.data && body.data.id) {
    const mpToken =
      $secrets.get('MERCADO_PAGO_ACCESS_TOKEN') || $secrets.get('MERCADOPAGO_ACCESS_TOKEN')

    if (mpToken) {
      try {
        const res = $http.send({
          url: `https://api.mercadopago.com/v1/payments/${body.data.id}`,
          method: 'GET',
          headers: { Authorization: 'Bearer ' + mpToken },
        })

        if (res.statusCode === 200) {
          const purchaseId = res.json.external_reference
          const status = res.json.status // 'approved', 'rejected', 'cancelled'

          if (purchaseId) {
            try {
              const purchase = $app.findRecordById('v1_saas_credit_purchases', purchaseId)
              const currentStatus = purchase.getString('status')

              if (currentStatus !== 'concluido' && currentStatus !== 'cancelado') {
                if (status === 'approved') {
                  $app.runInTransaction((txApp) => {
                    purchase.set('status', 'concluido')
                    txApp.save(purchase)

                    const u = txApp.findRecordById('users', purchase.getString('client'))
                    u.set('balance', (u.getFloat('balance') || 0) + purchase.getFloat('credits'))
                    txApp.save(u)
                  })
                } else if (status === 'rejected' || status === 'cancelled') {
                  purchase.set('status', 'cancelado')
                  $app.save(purchase)
                }
              }
            } catch (findErr) {
              console.log('Purchase record not found for external_reference', purchaseId)
            }
          }
        }
      } catch (err) {
        console.log('Failed to fetch MP payment', err.message)
      }
    }
  }

  return e.json(200, { ok: true })
})
