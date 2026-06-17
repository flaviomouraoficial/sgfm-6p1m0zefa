routerAdd(
  'POST',
  '/backend/v1/saas/360-links',
  (e) => {
    const body = e.requestInfo().body || {}
    const resultId = body.result_id
    const quotas = body.quotas || {}

    if (!resultId) return e.badRequestError('O ID do resultado é obrigatório.')

    const result = $app.findRecordById('v1_saas_results', resultId)
    if (!result) return e.notFoundError('Resultado não encontrado.')

    const auth = e.auth
    if (!auth || (result.getString('client') !== auth.id && auth.getString('role') !== 'admin')) {
      return e.forbiddenError('Acesso negado.')
    }

    const levels = ['estrategico', 'tatico', 'operacional']
    const linksCol = $app.findCollectionByNameOrId('v1_assessment_links')
    const links = []

    $app.runInTransaction((txApp) => {
      levels.forEach((level) => {
        let linkRecord
        try {
          linkRecord = txApp.findFirstRecordByFilter(
            'v1_assessment_links',
            `result_id = {:resultId} && link_type = {:level}`,
            { resultId, level },
          )
        } catch (_) {
          linkRecord = new Record(linksCol)
          linkRecord.set('result_id', resultId)
          linkRecord.set('cliente_id', result.getString('client'))
          linkRecord.set('link_type', level)
          linkRecord.set('link_unico', $security.randomString(16))
          linkRecord.set('status', 'ativo')
          linkRecord.set('criado_por', auth.id)
        }

        if (quotas[level] !== undefined) {
          linkRecord.set('quantidade_permitida', parseInt(quotas[level]) || 0)
        } else if (!linkRecord.id) {
          // Initialize default quotas from the diagnostic settings
          try {
            const diag = txApp.findRecordById('v1_saas_diagnostics', result.getString('diagnostic'))
            let q = diag.getInt('limit_' + level) || 0
            linkRecord.set('quantidade_permitida', q)
          } catch (err) {
            linkRecord.set('quantidade_permitida', 0)
          }
        }

        txApp.save(linkRecord)
        links.push({
          type: level,
          url: linkRecord.getString('link_unico'),
          quota: linkRecord.getInt('quantidade_permitida'),
          used: linkRecord.getInt('quantidade_usada') || 0,
        })
      })
    })

    return e.json(200, { links })
  },
  $apis.requireAuth(),
)
