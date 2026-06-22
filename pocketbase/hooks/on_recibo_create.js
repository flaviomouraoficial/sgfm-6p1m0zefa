onRecordAfterCreateSuccess((e) => {
  try {
    const recibo = e.record

    const tipo = recibo.get('tipo') // "Receber" | "Pagar"
    const numero = recibo.get('numero') || ''
    const clienteNome = recibo.get('cliente_nome') || ''
    const valor = Number(recibo.get('nf_valor_total')) || 0
    const dataCriacao = recibo.get('data_criacao')
    const clienteDocumento = recibo.get('cliente_documento') || ''

    const transactionType = tipo === 'Receber' ? 'Receita' : 'Despesa'
    const descAction = tipo === 'Receber' ? 'Recebimento' : 'Pagamento'
    const description = `Recibo de ${descAction} nº ${numero} - ${clienteNome}`

    let clientId = null

    if (clienteDocumento) {
      try {
        const clientByDoc = $app.findFirstRecordByData('v1_clientes', 'cnpj', clienteDocumento)
        clientId = clientByDoc.id
      } catch (_) {
        // Ignora erro se não encontrar por documento
      }
    }

    if (!clientId && clienteNome) {
      try {
        const clientByName = $app.findFirstRecordByData('v1_clientes', 'name', clienteNome)
        clientId = clientByName.id
      } catch (_) {
        // Ignora erro se não encontrar por nome
      }
    }

    const transactionsCol = $app.findCollectionByNameOrId('v1_transactions')
    const transaction = new Record(transactionsCol)

    transaction.set('description', description)
    transaction.set('amount', valor)
    transaction.set('type', transactionType)
    transaction.set('status', 'Pendente')
    transaction.set('category', 'Recibo')

    if (dataCriacao) {
      transaction.set('date', dataCriacao)
    }

    if (clientId) {
      transaction.set('client_id', clientId)
    }

    $app.save(transaction)
  } catch (err) {
    $app
      .logger()
      .error(
        'Erro na integracao financeira de recibo',
        'error',
        err.message || String(err),
        'recibo_id',
        e.record?.id,
      )
  }

  return e.next()
}, 'v1_recibos')
