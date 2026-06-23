migrate((app) => {
  try {
    const user = app.findAuthRecordByEmail('users', 'flavio@trendconsultoria.com.br')
    const purchases = app.findRecordsByFilter(
      'v1_saas_credit_purchases',
      `client = '${user.id}' && status = 'pendente' && credits = 5 && price_paid = 10`,
    )

    let currentBalance = user.getInt('balance')
    for (const p of purchases) {
      p.set('status', 'concluido')
      app.save(p)

      const checkUser = app.findRecordById('users', user.id)
      if (checkUser.getInt('balance') === currentBalance) {
        checkUser.set('balance', currentBalance + p.getInt('credits'))
        app.save(checkUser)
      }
      currentBalance = checkUser.getInt('balance')
    }
  } catch (err) {
    console.log('Migration 0061 failed or user not found:', err)
  }
})
