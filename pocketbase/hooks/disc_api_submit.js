routerAdd('POST', '/backend/v1/disc/submit', (e) => {
  const body = e.requestInfo().body
  const token = body.token
  if (!token) return e.badRequestError('Token não fornecido.')

  return $app.runInTransaction((txApp) => {
    let link
    try {
      link = txApp.findFirstRecordByData('v1_disc_links', 'token', token)
    } catch (_) {
      throw new BadRequestError('Link inválido.')
    }

    if (!link.getBool('ativo')) {
      throw new BadRequestError('Este link está desativado.')
    }

    const permitidos = link.getInt('usos_permitidos')
    const realizados = link.getInt('usos_realizados')
    if (permitidos !== -1 && realizados >= permitidos) {
      throw new BadRequestError('Este link já atingiu o limite de usos.')
    }

    const collection = txApp.findCollectionByNameOrId('v1_disc_respostas')
    const record = new Record(collection)
    record.set('link_id', link.id)
    record.set('nome', body.nome)
    record.set('email', body.email)
    record.set('pontuacao_d', body.pontuacao_d)
    record.set('pontuacao_i', body.pontuacao_i)
    record.set('pontuacao_s', body.pontuacao_s)
    record.set('pontuacao_c', body.pontuacao_c)
    record.set('perfil_predominante', body.perfil_predominante)
    record.set('respostas_json', body.respostas_json)
    record.set('nivel_relatorio', body.nivel_relatorio || 'essencial')

    txApp.save(record)

    link.set('usos_realizados', realizados + 1)
    txApp.save(link)

    try {
      let diagId = null
      const diags = txApp.findRecordsByFilter('v1_saas_diagnostics', "title ~ 'DISC'", '', 1, 0)
      if (diags && diags.length > 0) {
        diagId = diags[0].id
      }

      if (diagId) {
        const resCol = txApp.findCollectionByNameOrId('v1_saas_results')
        const result = new Record(resCol)
        result.set('diagnostic', diagId)
        result.set('status', 'Concluído')
        result.set('type', 'prisma')
        result.set('credits_consumed', 0)
        result.set('started_at', new Date().toISOString())
        result.set('completed_at', new Date().toISOString())
        result.set('nivel_relatorio', body.nivel_relatorio || 'essencial')
        result.set(
          'result_json',
          JSON.stringify({
            nome: body.nome,
            email: body.email,
            scores: {
              D: body.pontuacao_d,
              I: body.pontuacao_i,
              S: body.pontuacao_s,
              C: body.pontuacao_c,
            },
            perfil_predominante: body.perfil_predominante,
            respostas: body.respostas_json,
          }),
        )

        try {
          const userByEmail = txApp.findAuthRecordByEmail('users', body.email)
          if (userByEmail) {
            result.set('client', userByEmail.id)
          }
        } catch (_) {}

        txApp.save(result)
        record.set('result_id', result.id)
        txApp.save(record)
      }
    } catch (err) {
      console.log('Failed to create SaaS result for DISC:', err.message)
    }

    return e.json(200, { success: true, id: record.id })
  })
})
