// Auditoria SGFM (nov/2026), item 3 — correção idempotente das sessões órfãs
// (client_id e mentee_id vazios, mas com agendamento de origem).
//
// O agendamento NÃO tem relation para cliente (só cliente_nome/cliente_email);
// portanto a única cadeia determinística é: sessão -> agendamento -> cliente_email
// -> v1_clientes (por e-mail) e -> v1_mentees (por e-mail). Sem e-mail ou sem
// registro correspondente, a sessão é deixada como está e reportada nos logs.
migrate(
  (app) => {
    const sessoes = app.findRecordsByFilter(
      'v1_sessoes',
      "client_id = '' && mentee_id = '' && agendamento_id != ''",
      '-created',
      100,
      0,
    )
    let fix = 0
    const pend = []
    for (const sess of sessoes) {
      const agId = sess.getString('agendamento_id')
      let ag = null
      try {
        ag = app.findRecordById('v1_agendamentos', agId)
      } catch (_) {}
      if (!ag) {
        pend.push(sess.id + ' (agendamento inexistente: ' + agId + ')')
        continue
      }
      const email = ag.getString('cliente_email') || ''
      if (!email) {
        pend.push(sess.id + ' (agendamento sem cliente_email: ' + agId + ')')
        continue
      }
      let cid = ''
      let mid = ''
      try {
        cid = app.findFirstRecordByData('v1_clientes', 'email', email).id
      } catch (_) {}
      try {
        mid = app.findFirstRecordByData('v1_mentees', 'email', email).id
      } catch (_) {}
      if (cid || mid) {
        if (cid) sess.set('client_id', cid)
        if (mid) sess.set('mentee_id', mid)
        app.save(sess)
        fix++
      } else {
        pend.push(sess.id + ' (nenhum cliente/mentorado com o e-mail: ' + email + ')')
      }
    }
    console.log('[migracao-sessoes-orfas] sessões vinculadas: ' + fix)
    if (pend.length) {
      console.log('[migracao-sessoes-orfas] sem vínculo determinável: ' + pend.join(' | '))
    }
  },
  () => {
    // down: no-op — correção de dados não é reversível com segurança
  },
)
