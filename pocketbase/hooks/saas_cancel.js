routerAdd(
  'POST',
  '/backend/v1/saas/cancel/{id}',
  (e) => {
    const userId = e.auth?.id
    const resultId = e.request.pathValue('id')
    if (!userId) return e.unauthorizedError('Auth required')

    $app.runInTransaction((txApp) => {
      const result = txApp.findRecordById('v1_saas_results', resultId)
      if (result.getString('client') !== userId && !e.hasSuperuserAuth()) {
        throw new ForbiddenError('Not your result')
      }
      if (result.getString('status') !== 'em_progresso') {
        throw new BadRequestError('Cannot cancel this diagnostic')
      }

      const cost = result.getFloat('credits_consumed') || 0
      const userTx = txApp.findRecordById('users', result.getString('client'))
      userTx.set('balance', userTx.getFloat('balance') + cost)
      txApp.save(userTx)

      result.set('status', 'cancelado')
      txApp.save(result)
    })

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
