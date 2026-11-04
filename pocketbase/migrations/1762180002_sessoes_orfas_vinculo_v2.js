// Auditoria SGFM (nov/2026), item 3 v2 — correção idempotente das sessões órfãs
// (client_id e mentee_id vazios, mas com agendamento de origem).
//
// v1: vinculava apenas quando já existia v1_clientes/v1_mentees com o e-mail do
// agendamento — nos 8 casos de jun–out/2026 nada foi encontrado (os cadastros
// nunca existiram). v2: além de vincular, CRIA o cliente a partir dos dados do
// agendamento de origem (nome, e-mail, telefone e empresa), sem inventar nada.
// Mentee só é vinculado quando já existir — criar mentee é decisão do Flávio
// no CRM (informado e aprovado: duplicidade de e-mail ele reconcilia depois).
migrate(
  (app) => {
    // 1) Sessões órfãs com agendamento de origem
    const sessoes = app.findRecordsByFilter(
      'v1_sessoes',
      "client_id = '' && mentee_id = '' && agendamento_id != ''",
      '-created',
      100,
      0,
    )
    let fix = 0
    let clientesCriados = 0
    let menteesVinculados = 0
    const pend = []

    // 2) Índice case-insensitive de clientes já existentes (por e-mail)
    const clientesPorEmail = {}
    for (const c of app.findRecordsByFilter('v1_clientes', '', '', 1000, 0)) {
      const em = c.getString('email').trim().toLowerCase()
      if (em) clientesPorEmail[em] = c
    }

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
      const email = ag.getString('cliente_email').trim().toLowerCase()
      if (!email) {
        pend.push(sess.id + ' (agendamento sem cliente_email: ' + agId + ')')
        continue
      }

      // 3) Cliente: busca case-insensitive ou cria a partir do agendamento
      let cliente = clientesPorEmail[email]
      if (!cliente) {
        const nome = ag.getString('cliente_nome').trim()
        const col = app.findCollectionByNameOrId('v1_clientes')
        cliente = new Record(col)
        cliente.set('name', nome || email)
        cliente.set('email', email)
        const tel = ag.getString('cliente_telefone').trim()
        if (tel) cliente.set('phone', tel)
        const empId = ag.getString('empresa_id')
        if (empId) cliente.set('empresa_id', empId)
        app.save(cliente)
        clientesPorEmail[email] = cliente
        clientesCriados++
        console.log(
          '[sessoes-orfas-v2] cliente criado do agendamento ' +
            agId +
            ': ' +
            nome +
            ' <' +
            email +
            '>' +
            (tel ? ' tel=' + tel : '') +
            (empId ? ' empresa=' + empId : ''),
        )
      }

      // 4) Mentee: vincula apenas se já existir (não criar)
      let menteeId = ''
      try {
        menteeId = app.findFirstRecordByData('v1_mentees', 'email', email).id
        menteesVinculados++
      } catch (_) {}

      sess.set('client_id', cliente.id)
      if (menteeId) sess.set('mentee_id', menteeId)
      app.save(sess)
      fix++
      console.log(
        '[sessoes-orfas-v2] sessão ' +
          sess.id +
          ' vinculada a cliente ' +
          cliente.id +
          (menteeId ? ' e mentee ' + menteeId : '') +
          ' (agendamento ' +
          agId +
          ')',
      )
    }

    console.log(
      '[sessoes-orfas-v2] resumo: sessões vinculadas=' +
        fix +
        ', clientes criados=' +
        clientesCriados +
        ', mentees vinculados=' +
        menteesVinculados +
        ', sem vínculo=' +
        pend.length,
    )
    if (pend.length) {
      console.log('[sessoes-orfas-v2] sem vínculo determinável: ' + pend.join(' | '))
    }
  },
  () => {
    // down: no-op — correção de dados não é reversível com segurança
  },
)
