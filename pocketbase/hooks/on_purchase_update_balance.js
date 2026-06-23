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
    }
  }
  e.next()
}, 'v1_saas_credit_purchases')
