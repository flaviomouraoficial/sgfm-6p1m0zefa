cronAdd('mercadopago_token_refresh', '0 2 * * *', () => {
  const refreshToken = $secrets.get('MERCADOPAGO_REFRESH_TOKEN')
  const clientId = $secrets.get('MERCADOPAGO_CLIENT_ID')
  const clientSecret = $secrets.get('MERCADOPAGO_CLIENT_SECRET')

  if (!refreshToken || !clientId || !clientSecret) {
    console.log('Skipping MP token refresh: missing credentials')
    return
  }

  try {
    const res = $http.send({
      url: 'https://api.mercadopago.com/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: `grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}`,
      timeout: 30,
    })

    if (res.statusCode === 200 && res.json.access_token) {
      console.log('MP token refreshed successfully, new access token acquired.')
      try {
        const records = $app.findRecordsByFilter('settings_store', '', '', 1, 0)
        let settingsRecord =
          records.length > 0
            ? records[0]
            : new Record($app.findCollectionByNameOrId('settings_store'))

        const data = settingsRecord.get('data') || {}
        data.mercadopago = {
          access_token: res.json.access_token,
          refresh_token: res.json.refresh_token,
          updated_at: new Date().toISOString(),
        }
        settingsRecord.set('data', data)
        $app.save(settingsRecord)
      } catch (err) {
        console.log('Failed to save MP token to settings_store', err.message)
      }
    } else {
      console.log('Failed to refresh MP token', res.statusCode)
    }
  } catch (err) {
    console.log('Error in MP token refresh cron', err.message)
  }
})
