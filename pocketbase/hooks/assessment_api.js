routerAdd('GET', '/backend/v1/assessment/link/{slug}', (e) => {
  const slug = e.request.pathValue('slug')
  let link
  try {
    link = $app.findFirstRecordByData('v1_assessment_links', 'link_unico', slug)
  } catch (_) {
    return e.notFoundError('Link não encontrado')
  }

  if (link.getString('status') !== 'ativo') {
    return e.badRequestError('Link inativo ou expirado')
  }

  const expiracao = link.getString('data_expiracao')
  if (expiracao && new Date(expiracao) < new Date()) {
    return e.badRequestError('Link expirado')
  }

  const usada = link.getInt('quantidade_usada')
  const permitida = link.getInt('quantidade_permitida')
  if (usada >= permitida) {
    return e.badRequestError('Limite de respostas atingido para este link')
  }

  const cliente = $app.findRecordById('v1_clientes', link.getString('cliente_id'))

  return e.json(200, {
    id: link.id,
    cliente_id: cliente.id,
    cliente_nome: cliente.getString('name'),
  })
})

routerAdd('POST', '/backend/v1/assessment/submit/{slug}', (e) => {
  const slug = e.request.pathValue('slug')
  let link
  try {
    link = $app.findFirstRecordByData('v1_assessment_links', 'link_unico', slug)
  } catch (_) {
    return e.notFoundError('Link não encontrado')
  }

  const expiracao = link.getString('data_expiracao')
  if (expiracao && new Date(expiracao) < new Date()) {
    return e.badRequestError('Link expirado')
  }
  if (link.getString('status') !== 'ativo') {
    return e.badRequestError('Link inativo')
  }
  if (link.getInt('quantidade_usada') >= link.getInt('quantidade_permitida')) {
    return e.badRequestError('Limite de respostas atingido')
  }

  const body = e.requestInfo().body || {}
  const email = (body.email || '').trim()

  if (!email) {
    return e.badRequestError('Email é obrigatório')
  }

  try {
    const existing = $app.findFirstRecordByFilter(
      'v1_assessment_respostas',
      'link_id = {:linkId} && email_respondente = {:email}',
      { linkId: link.id, email: email },
    )
    if (existing) {
      return e.badRequestError('Este e-mail já enviou uma resposta para este link')
    }
  } catch (_) {
    // not found, ok
  }

  return $app.runInTransaction((txApp) => {
    const colResp = txApp.findCollectionByNameOrId('v1_assessment_respostas')
    const resp = new Record(colResp)
    resp.set('link_id', link.id)
    resp.set('cliente_id', link.getString('cliente_id'))
    resp.set('nome_respondente', body.nome)
    resp.set('email_respondente', email)
    resp.set('grau_parentesco', body.grau_parentesco)
    resp.set('atua_na_organizacao', body.atua_na_organizacao ? true : false)
    resp.set('respostas_json', body.respostas || {})
    resp.set('status', 'completo')
    txApp.save(resp)

    const ans = body.respostas || {}
    let sums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let weights = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    const questions = txApp.findRecordsByFilter('v1_assessment_questions', '1=1', 'order', 200, 0)

    for (const q of questions) {
      const order = q.getInt('order')
      const pilar = q.getString('pilar')
      let w = q.getFloat('weight')
      if (w <= 0) w = 1 // default fallback

      const val = Number(ans['q' + order] || 0)

      let idx = -1
      if (pilar === 'Maturidade') idx = 0
      else if (pilar === 'Competências') idx = 1
      else if (pilar === 'Inteligência Emocional') idx = 2
      else if (pilar === 'Visão Estratégica') idx = 3
      else if (pilar === 'Liderança') idx = 4
      else if (pilar === 'Integridade') idx = 5
      else if (pilar === 'Comunicação') idx = 6
      else if (pilar === 'Adaptabilidade') idx = 7
      else if (pilar === 'Relacionamento Familiar') idx = 8
      else if (pilar === 'Mapeamento Agro') idx = 9

      if (idx !== -1) {
        sums[idx] += val * w
        weights[idx] += w
      }
    }

    const avgs = sums.map((s, idx) => (weights[idx] > 0 ? s / weights[idx] : 0))

    let estado = 'verde'
    let hasRed = false
    let hasAmarelo = false
    for (let i = 0; i < 10; i++) {
      if (avgs[i] < 2.5) hasRed = true
      else if (avgs[i] < 4.0) hasAmarelo = true
    }

    if (hasRed) estado = 'vermelho'
    else if (hasAmarelo) estado = 'amarelo'

    const colCalc = txApp.findCollectionByNameOrId('v1_assessment_calculos')
    const calc = new Record(colCalc)
    calc.set('resposta_id', resp.id)
    calc.set('pilar_1_media', avgs[0])
    calc.set('pilar_2_media', avgs[1])
    calc.set('pilar_3_media', avgs[2])
    calc.set('pilar_4_media', avgs[3])
    calc.set('pilar_5_media', avgs[4])
    calc.set('pilar_6_media', avgs[5])
    calc.set('pilar_7_media', avgs[6])
    calc.set('pilar_8_media', avgs[7])
    calc.set('pilar_9_media', avgs[8])
    calc.set('mapeamento_agro_media', avgs[9])
    calc.set('estado_sucessao', estado)
    txApp.save(calc)

    const linkRec = txApp.findRecordById('v1_assessment_links', link.id)
    linkRec.set('quantidade_usada', linkRec.getInt('quantidade_usada') + 1)
    txApp.save(linkRec)

    return e.json(200, { success: true, id: resp.id })
  })
})
