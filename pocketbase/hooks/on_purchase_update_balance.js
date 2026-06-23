onRecordAfterUpdateSuccess((e) => {
  if (
    e.record.getString('status') === 'concluido' &&
    e.record.original().getString('status') !== 'concluido'
  ) {
    const userId = e.record.getString('client')
    const credits = e.record.getInt('credits')
    try {
      const user = $app.findRecordById('users', userId)
      user.set('balance', user.getInt('balance') + credits)
      $app.save(user)
      $app
        .logger()
        .info(
          'manual purchase approval: balance updated',
          'purchaseId',
          e.record.id,
          'userId',
          userId,
          'creditsAdded',
          credits,
        )
    } catch (err) {
      $app.logger().error('failed to update user balance', 'err', err.message)
      try {
        const logsCol = $app.findCollectionByNameOrId('v1_webhook_logs')
        const logRec = new Record(logsCol)
        logRec.set('provider', 'system')
        logRec.set('event_type', 'balance_update_error')
        logRec.set('status', 'error')
        logRec.set('error_message', err.message)
        logRec.set('payload', {
          purchase_id: e.record.id,
          client_id: userId,
          credits: credits,
        })
        $app.save(logRec)
      } catch (logErr) {
        $app.logger().error('failed to write webhook log', 'err', logErr.message)
      }
    }
  }
  e.next()
}, 'v1_saas_credit_purchases')
