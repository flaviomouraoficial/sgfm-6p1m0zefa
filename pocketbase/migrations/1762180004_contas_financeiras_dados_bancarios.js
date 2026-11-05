// Adiciona dados bancários completos às contas financeiras (banco, agência, número da conta, chave PIX)
// e retroalimenta as contas existentes com os dados já usados nos recibos.
// Idempotente: no-op se os campos já existirem na coleção.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_contas_financeiras')

    const camposNovos = ['banco', 'agencia', 'numero_conta', 'chave_pix'].filter(
      (n) => !col.fields.getByName(n),
    )

    if (camposNovos.length > 0) {
      if (!col.fields.getByName('banco')) {
        col.fields.add(new TextField({ name: 'banco', max: 100 }))
      }
      if (!col.fields.getByName('agencia')) {
        col.fields.add(new TextField({ name: 'agencia', max: 50 }))
      }
      if (!col.fields.getByName('numero_conta')) {
        col.fields.add(new TextField({ name: 'numero_conta', max: 50 }))
      }
      if (!col.fields.getByName('chave_pix')) {
        col.fields.add(new TextField({ name: 'chave_pix', max: 100 }))
      }
      app.save(col)
    }

    // ---- Backfill das contas existentes (evidência dos recibos) ----
    // Recibos usam "Ag. 0001 - C.C 34188353-0" (às vezes com " - PIX 09.465.223/0001-07").
    const contas = app.findRecordsByFilter('v1_contas_financeiras', '', '', 0, 0)

    for (const conta of contas) {
      const id = conta.getString('id')
      const nome = conta.getString('nome')

      // Dados conhecidos apenas da conta C6 PJ (id 7bkqvt3mgarmnz4) — extraídos dos recibos.
      if (id === '7bkqvt3mgarmnz4') {
        if (conta.getString('banco') === '') conta.set('banco', 'C6 Bank (336)')
        if (conta.getString('agencia') === '') conta.set('agencia', '0001')
        if (conta.getString('numero_conta') === '') conta.set('numero_conta', '34188353-0')
        if (conta.getString('chave_pix') === '') conta.set('chave_pix', '09.465.223/0001-07')
      }

      // Sem evidência nos recibos para agência/conta: preenche só o nome do banco com o próprio nome.
      if (conta.getString('banco') === '') conta.set('banco', nome)

      app.save(conta)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_contas_financeiras')
    for (const nome of ['banco', 'agencia', 'numero_conta', 'chave_pix']) {
      const f = col.fields.getByName(nome)
      if (f) {
        col.fields.removeByName(nome)
      }
    }
    app.save(col)
  },
)
