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

    txApp.save(record)

    link.set('usos_realizados', realizados + 1)
    txApp.save(link)

    return e.json(200, { success: true, id: record.id })
  })
})
