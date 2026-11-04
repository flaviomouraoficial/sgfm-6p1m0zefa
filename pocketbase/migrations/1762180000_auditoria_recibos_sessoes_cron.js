// Auditoria SGFM (nov/2026) — itens 1, 2 e 3, correções idempotentes (no-op em banco vazio).
// 1) Desregistra o cron fantasma gc_validate_once (o hook que o registrava foi removido).
// 2) Preenche empresa_id das transações de recibos a partir do recibo de origem
//    (empresa do recibo; sem ela, resolve pela conta financeira do campo banco —
//    determinístico, sem chute).
// 3) Preenche cliente/mentorado das sessões órfãs a partir do agendamento de origem
//    (relação direta; sem ela, resolve pelo cliente_email do agendamento —
//    determinístico, sem chute).
migrate(
  (app) => {
    // ---- Item 1: cron fantasma ----
    try {
      cronRemove('gc_validate_once')
      console.log('[migracao-auditoria] cron gc_validate_once desregistrado')
    } catch (err) {
      console.log('[migracao-auditoria] cron gc_validate_once já ausente: ' + (err.message || err))
    }

    // ---- Item 2: transações de recibos sem empresa_id ----
    const txs = app.findRecordsByFilter(
      'v1_transactions',
      "recibo_id != '' && empresa_id = ''",
      '-created',
      500,
      0,
    )
    let txFix = 0
    const txPend = []
    for (const tx of txs) {
      let emp = ''
      try {
        const recibo = app.findRecordById('v1_recibos', tx.getString('recibo_id'))
        emp = recibo.getString('empresa_id') || ''
        if (!emp) {
          const banco = recibo.getString('banco') || ''
          if (banco) {
            try {
              const conta = app.findFirstRecordByData('v1_contas_financeiras', 'nome', banco)
              emp = conta.getString('empresa_id') || ''
            } catch (_) {}
          }
        }
      } catch (_) {}
      if (emp) {
        tx.set('empresa_id', emp)
        app.save(tx)
        txFix++
      } else {
        txPend.push(tx.id + ' (recibo ' + tx.getString('recibo_id') + ')')
      }
    }
    console.log('[migracao-auditoria] transações de recibo com empresa_id preenchida: ' + txFix)
    if (txPend.length) {
      console.log(
        '[migracao-auditoria] transações SEM empresa determinável (deixadas vazias): ' +
          txPend.join(', '),
      )
    }

    // ---- Item 3: sessões órfãs (sem cliente/mentorado, com agendamento de origem) ----
    const sessoes = app.findRecordsByFilter(
      'v1_sessoes',
      "client_id = '' && mentee_id = '' && agendamento_id != ''",
      '-created',
      100,
      0,
    )
    let sessFix = 0
    const sessPend = []
    for (const sess of sessoes) {
      let cid = ''
      let mid = ''
      try {
        const ag = app.findRecordById('v1_agendamentos', sess.getString('agendamento_id'))
        cid = ag.getString('cliente_id') || ag.getString('client_id') || ''
        mid = ag.getString('mentee_id') || ''
        const email = ag.getString('cliente_email') || ''
        if (!cid && email) {
          try {
            cid = app.findFirstRecordByData('v1_clientes', 'email', email).id
          } catch (_) {}
        }
        if (!mid && email) {
          try {
            mid = app.findFirstRecordByData('v1_mentees', 'email', email).id
          } catch (_) {}
        }
      } catch (_) {}
      if (cid || mid) {
        if (cid) sess.set('client_id', cid)
        if (mid) sess.set('mentee_id', mid)
        app.save(sess)
        sessFix++
      } else {
        sessPend.push(sess.id + ' (ag ' + sess.getString('agendamento_id') + ')')
      }
    }
    console.log('[migracao-auditoria] sessões órfãs vinculadas: ' + sessFix)
    if (sessPend.length) {
      console.log(
        '[migracao-auditoria] sessões sem vínculo determinável (deixadas como estão): ' +
          sessPend.join(', '),
      )
    }
  },
  (app) => {
    // down: no-op — correções de dados não são reversíveis com segurança
  },
)
