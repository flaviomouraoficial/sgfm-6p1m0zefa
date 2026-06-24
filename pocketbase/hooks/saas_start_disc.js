routerAdd(
  'POST',
  '/backend/v1/saas/start-disc',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const user = $app.findRecordById('users', userId)
    const balance = user.getFloat('balance') || 0

    if (balance < 1) {
      return e.badRequestError('Saldo insuficiente')
    }

    let empresaId = null
    try {
      const empresas = $app.findRecordsByFilter('v1_disc_empresas', 'name = "Geral"', '', 1, 0)
      if (empresas && empresas.length > 0) {
        empresaId = empresas[0].id
      }
    } catch (_) {}

    if (!empresaId) {
      const empCol = $app.findCollectionByNameOrId('v1_disc_empresas')
      const emp = new Record(empCol)
      emp.set('name', 'Geral')
      $app.save(emp)
      empresaId = emp.id
    }

    const linkCol = $app.findCollectionByNameOrId('v1_disc_links')
    const newLink = new Record(linkCol)
    if (empresaId) {
      newLink.set('empresa_id', empresaId)
    }
    newLink.set('usos_permitidos', 1)
    newLink.set('usos_realizados', 0)
    newLink.set('ativo', true)
    const tk = $security.randomString(16)
    newLink.set('token', tk)
    $app.save(newLink)
    const token = tk

    user.set('balance', balance - 1)
    $app.save(user)

    let diagId = null
    try {
      const diags = $app.findRecordsByFilter('v1_saas_diagnostics', "title ~ 'DISC'", '', 1, 0)
      if (diags && diags.length > 0) {
        diagId = diags[0].id
      }
    } catch (_) {}

    if (diagId) {
      const resCol = $app.findCollectionByNameOrId('v1_saas_results')
      const result = new Record(resCol)
      result.set('client', userId)
      result.set('diagnostic', diagId)
      result.set('type', 'prisma')
      result.set('status', 'em_progresso')
      result.set('credits_consumed', 1)
      result.set('started_at', new Date().toISOString())
      $app.save(result)
    }

    return e.json(200, { token, balance: user.getFloat('balance') })
  },
  $apis.requireAuth(),
)
