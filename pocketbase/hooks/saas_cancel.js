routerAdd(
  'POST',
  '/backend/v1/saas/cancel/{id}',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const id = e.request.pathValue('id')
    const result = $app.findRecordById('v1_saas_results', id)

    if (result.getString('client') !== userId && e.auth?.getString('role') !== 'admin') {
      return e.forbiddenError('Not allowed')
    }

    if (result.getString('status') !== 'em_progresso') {
      return e.badRequestError('Apenas diagnósticos em progresso podem ser cancelados')
    }

    const cost = result.getFloat('credits_consumed')

    const user = $app.findRecordById('users', result.getString('client'))
    user.set('balance', (user.getFloat('balance') || 0) + cost)
    $app.save(user)

    result.set('status', 'cancelado')
    $app.save(result)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
