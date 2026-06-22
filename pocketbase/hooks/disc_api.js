routerAdd('POST', '/backend/v1/disc/submit', (e) => {
  const body = e.requestInfo().body || {}
  if (!body.token) return e.badRequestError('Token is required')

  let link
  try {
    link = $app.findFirstRecordByData('v1_disc_links', 'token', body.token)
  } catch (_) {
    return e.notFoundError('Link not found or invalid')
  }

  if (!link.getBool('ativo')) return e.badRequestError('Este link de avaliação está inativo.')

  const permitidos = link.getInt('usos_permitidos')
  const realizados = link.getInt('usos_realizados')

  if (permitidos !== -1 && realizados >= permitidos) {
    return e.badRequestError('O limite de utilizações para este link foi atingido.')
  }

  const respCol = $app.findCollectionByNameOrId('v1_disc_respostas')
  const r = new Record(respCol)
  r.set('link_id', link.id)
  r.set('nome', body.nome || 'Anônimo')
  r.set('email', body.email || '')
  r.set('pontuacao_d', body.pontuacao_d || 0)
  r.set('pontuacao_i', body.pontuacao_i || 0)
  r.set('pontuacao_s', body.pontuacao_s || 0)
  r.set('pontuacao_c', body.pontuacao_c || 0)
  r.set('perfil_predominante', body.perfil_predominante || '')
  r.set('respostas_json', body.respostas_json || {})

  $app.runInTransaction((txApp) => {
    txApp.save(r)
    link.set('usos_realizados', realizados + 1)
    txApp.save(link)
  })

  return e.json(200, { id: r.id })
})

routerAdd('GET', '/backend/v1/disc/link/{token}', (e) => {
  const token = e.request.pathValue('token')
  let link
  try {
    link = $app.findFirstRecordByData('v1_disc_links', 'token', token)
  } catch (_) {
    return e.notFoundError('Link inválido ou não encontrado.')
  }

  if (!link.getBool('ativo')) return e.badRequestError('Este link está inativo.')
  const permitidos = link.getInt('usos_permitidos')
  const realizados = link.getInt('usos_realizados')
  if (permitidos !== -1 && realizados >= permitidos) {
    return e.badRequestError('Limite de usos atingido para este link.')
  }

  let empresaNome = ''
  try {
    $app.expandRecord(link, ['empresa_id'])
    const empresa = link.expandedOne('empresa_id')
    if (empresa) empresaNome = empresa.getString('name')
  } catch (_) {}

  return e.json(200, {
    id: link.id,
    usos_permitidos: permitidos,
    usos_realizados: realizados,
    empresa: empresaNome,
  })
})
