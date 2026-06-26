routerAdd(
  'POST',
  '/backend/v1/log-error',
  (e) => {
    const body = e.requestInfo().body || {}

    $app
      .logger()
      .error(
        'Frontend Save Error',
        'action',
        String(body.action || 'unknown'),
        'message',
        String(body.message || 'No message'),
        'payload',
        JSON.stringify(body.payload || {}),
      )

    try {
      const col = $app.findCollectionByNameOrId('v1_webhook_logs')
      const record = new Record(col)
      record.set('provider', 'frontend_error_log')
      record.set('event_type', String(body.action || 'save_error'))
      record.set('payload', body.payload || {})
      record.set('status', 'error')
      record.set('error_message', String(body.message || 'Unknown error'))
      $app.saveNoValidate(record)
    } catch (err) {
      $app.logger().error('Failed to insert webhook_log', 'err', err.message)
    }

    return e.json(200, { logged: true })
  },
  $apis.requireAuth(),
)
