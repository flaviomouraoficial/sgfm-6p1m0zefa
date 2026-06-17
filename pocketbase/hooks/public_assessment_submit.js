routerAdd('POST', '/backend/v1/public-assessment/{slug}/submit', (e) => {
  const slug = e.request.pathValue('slug')
  const body = e.requestInfo().body || {}

  try {
    return $app.runInTransaction((txApp) => {
      const link = txApp.findFirstRecordByData('v1_assessment_links', 'link_unico', slug)

      if (link.getString('status') !== 'ativo') {
        throw new Error('Link inativo')
      }
      if (link.getInt('quantidade_usada') >= link.getInt('quantidade_permitida')) {
        throw new Error('Limite de usos atingido')
      }

      const diagId = link.getString('diagnostic_id')
      let returnId = ''

      if (diagId) {
        const resCol = txApp.findCollectionByNameOrId('v1_saas_results')
        const result = new Record(resCol)

        // Use 'criado_por' which references 'users', rather than 'cliente_id' which references 'v1_clientes'
        // This prevents the relation type mismatch error ("Failed to find all relation records").
        const clientId = link.getString('criado_por')
        if (!clientId)
          throw new Error('ID do criador ausente no link para relacionamento de cliente')

        result.set('client', clientId)
        result.set('diagnostic', diagId)
        result.set('status', 'Concluído')
        result.set('result_json', body)
        result.set('completed_at', new Date().toISOString())

        const diagnostic = txApp.findRecordById('v1_saas_diagnostics', diagId)
        result.set('type', diagnostic.getString('type'))

        txApp.save(result)
        returnId = result.id
      } else {
        const resCol = txApp.findCollectionByNameOrId('v1_assessment_respostas')
        const resposta = new Record(resCol)
        resposta.set('link_id', link.id)
        resposta.set('cliente_id', link.getString('cliente_id'))
        resposta.set('nome_respondente', body.nome || 'Anônimo')
        resposta.set('email_respondente', body.email || 'anon@example.com')
        resposta.set('grau_parentesco', body.grau_parentesco || 'outro')
        resposta.set('respostas_json', body.answers || body.respostas || body)
        resposta.set('status', 'completo')

        txApp.save(resposta)
        returnId = resposta.id
      }

      link.set('quantidade_usada', link.getInt('quantidade_usada') + 1)
      txApp.save(link)

      return e.json(200, { success: true, result_id: returnId })
    })
  } catch (err) {
    return e.badRequestError(err.message)
  }
})
