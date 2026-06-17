routerAdd('GET', '/backend/v1/public-assessment/{slug}', (e) => {
  const slug = e.request.pathValue('slug')
  try {
    const link = $app.findFirstRecordByData('v1_assessment_links', 'link_unico', slug)

    if (link.getString('status') !== 'ativo') {
      return e.badRequestError('Link inativo')
    }

    if (link.getInt('quantidade_usada') >= link.getInt('quantidade_permitida')) {
      return e.badRequestError('Limite de usos atingido')
    }

    if (link.getString('data_expiracao')) {
      const exp = new Date(link.getString('data_expiracao'))
      if (exp < new Date()) {
        return e.badRequestError('Link expirado')
      }
    }

    const diagId = link.getString('diagnostic_id')
    let diagnostic = null
    let questions = []

    if (diagId) {
      diagnostic = $app.findRecordById('v1_saas_diagnostics', diagId)
      questions = $app.findRecordsByFilter(
        'v1_saas_questions',
        `diagnostic='${diagId}'`,
        'order',
        1000,
        0,
      )
    } else {
      questions = $app.findRecordsByFilter('v1_assessment_questions', '', 'order', 1000, 0)
    }

    return e.json(200, {
      link: {
        id: link.id,
        type: link.getString('link_type'),
        cliente_id: link.getString('cliente_id'),
      },
      diagnostic: diagnostic
        ? {
            id: diagnostic.id,
            title: diagnostic.getString('title'),
            type: diagnostic.getString('type'),
            description: diagnostic.getString('description'),
          }
        : {
            id: 'legacy',
            title: 'Assessment (Sucessão)',
            type: 'legacy',
          },
      questions: questions.map((q) => ({
        id: q.id,
        dimension: q.getString('dimension') || q.getString('pilar'),
        text: q.getString('text') || q.getString('text_full'),
        order: q.getInt('order'),
      })),
    })
  } catch (err) {
    return e.notFoundError('Link inválido ou expirado')
  }
})
