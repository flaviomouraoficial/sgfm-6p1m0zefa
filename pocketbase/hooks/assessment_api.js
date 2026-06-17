routerAdd('GET', '/backend/v1/assessment/link/{slug}', (e) => {
  const slug = e.request.pathValue('slug')
  try {
    const link = $app.findFirstRecordByData('v1_assessment_links', 'link_unico', slug)
    const client = $app.findRecordById('v1_clientes', link.getString('cliente_id'))

    const status = link.getString('status')
    const max = link.getInt('quantidade_permitida')
    const used = link.getInt('quantidade_usada')

    if (status === 'expirado' || status === 'inativo') {
      return e.badRequestError('Este link está inativo ou expirado.')
    }
    if (max > 0 && used >= max) {
      return e.badRequestError('O limite de respostas para este link foi atingido.')
    }

    let diagType = 'strategic_360'
    const diagId = link.getString('diagnostic_id')
    if (diagId) {
      try {
        const diag = $app.findRecordById('v1_saas_diagnostics', diagId)
        diagType = diag.getString('type')
      } catch (_) {}
    }

    return e.json(200, {
      id: link.id,
      cliente_id: client.id,
      cliente_nome: client.getString('name'),
      link_type: link.getString('link_type'),
      diagnostic_id: diagId,
      diagnostic_type: diagType,
      quantidade_usada: used,
      quantidade_permitida: max,
      status: status,
    })
  } catch (err) {
    return e.notFoundError('Link não encontrado ou inválido.')
  }
})

routerAdd('POST', '/backend/v1/assessment/submit/{slug}', (e) => {
  const slug = e.request.pathValue('slug')
  try {
    const link = $app.findFirstRecordByData('v1_assessment_links', 'link_unico', slug)

    const max = link.getInt('quantidade_permitida')
    const used = link.getInt('quantidade_usada')
    if (max > 0 && used >= max) {
      return e.badRequestError('O limite de respostas para este link foi atingido.')
    }

    const body = e.requestInfo().body

    $app.runInTransaction((txApp) => {
      const resCol = txApp.findCollectionByNameOrId('v1_assessment_respostas')
      const record = new Record(resCol)
      record.set('link_id', link.id)
      record.set('cliente_id', link.getString('cliente_id'))
      record.set('nome_respondente', body.nome || '')
      record.set('email_respondente', body.email || '')
      record.set('grau_parentesco', body.grau_parentesco || 'outro')
      record.set('atua_na_organizacao', !!body.atua_na_organizacao)
      record.set('respostas_json', body.respostas || {})
      record.set('status', 'completo')
      txApp.save(record)

      const updatedLink = txApp.findRecordById('v1_assessment_links', link.id)
      updatedLink.set('quantidade_usada', updatedLink.getInt('quantidade_usada') + 1)
      txApp.save(updatedLink)
    })

    return e.json(200, { success: true })
  } catch (err) {
    return e.badRequestError('Erro ao processar resposta. Tente novamente.')
  }
})
