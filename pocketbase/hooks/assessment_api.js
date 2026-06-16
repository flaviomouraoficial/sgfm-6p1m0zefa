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
    let counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    for (let i = 1; i <= 5; i++) {
      sums[0] += Number(ans['q' + i] || 0)
      counts[0]++
    }
    for (let i = 6; i <= 10; i++) {
      sums[1] += Number(ans['q' + i] || 0)
      counts[1]++
    }
    for (let i = 11; i <= 15; i++) {
      sums[2] += Number(ans['q' + i] || 0)
      counts[2]++
    }
    for (let i = 16; i <= 20; i++) {
      sums[3] += Number(ans['q' + i] || 0)
      counts[3]++
    }
    for (let i = 21; i <= 25; i++) {
      sums[4] += Number(ans['q' + i] || 0)
      counts[4]++
    }
    for (let i = 26; i <= 30; i++) {
      sums[5] += Number(ans['q' + i] || 0)
      counts[5]++
    }
    for (let i = 31; i <= 35; i++) {
      sums[6] += Number(ans['q' + i] || 0)
      counts[6]++
    }
    for (let i = 36; i <= 40; i++) {
      sums[7] += Number(ans['q' + i] || 0)
      counts[7]++
    }
    for (let i = 41; i <= 45; i++) {
      sums[8] += Number(ans['q' + i] || 0)
      counts[8]++
    }
    for (let i = 46; i <= 51; i++) {
      sums[9] += Number(ans['q' + i] || 0)
      counts[9]++
    }

    const avgs = sums.map((s, idx) => (counts[idx] ? s / counts[idx] : 0))

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
