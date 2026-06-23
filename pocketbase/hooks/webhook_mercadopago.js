routerAdd('POST', '/backend/v1/saas/webhook/mercadopago', (e) => {
  const body = e.requestInfo().body || {}

  let logRecord
  try {
    const logCollection = $app.findCollectionByNameOrId('v1_webhook_logs')
    logRecord = new Record(logCollection)
    logRecord.set('provider', 'mercadopago')
    logRecord.set('event_type', body.type || body.action || 'unknown')
    logRecord.set('payload', JSON.stringify(body))
    logRecord.set('status', 'pending')
    logRecord.set('status_code', 200)
  } catch (err) {}

  let success = false
  let errorMessage = ''

  if (body.type === 'payment' && body.data && body.data.id) {
    const mpToken =
      $os.getenv('MERCADOPAGO_ACCESS_TOKEN') ||
      $secrets.get('MERCADOPAGO_ACCESS_TOKEN') ||
      $secrets.get('MERCADO_PAGO_ACCESS_TOKEN')

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
              success = true
            } catch (findErr) {
              errorMessage = 'Purchase record not found for external_reference ' + purchaseId
              console.log(errorMessage)
            }
          } else {
            errorMessage = 'No external_reference found'
          }
        } else {
          errorMessage = `MP API returned ${res.statusCode}`
        }
      } catch (err) {
        errorMessage = 'Failed to fetch MP payment: ' + err.message
        console.log(errorMessage)
      }
    } else {
      errorMessage = 'No MP token configured'
    }
  } else {
    success = true
  }

  if (logRecord) {
    logRecord.set('status', success ? 'success' : 'error')
    if (errorMessage) {
      logRecord.set('error_message', errorMessage)
      logRecord.set('status_code', 500)
    }
    try {
      $app.saveNoValidate(logRecord)
    } catch (e) {}
  }

  return e.json(200, { ok: true })
})
