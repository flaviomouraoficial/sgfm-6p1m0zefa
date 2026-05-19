routerAdd('POST', '/backend/v1/public-book-slot/{id}', (e) => {
  const slotId = e.request.pathValue('id')
  const body = e.requestInfo().body

  if (!body || !body.name || !body.email || !body.phone) {
    throw new BadRequestError('Nome, email e telefone são obrigatórios.')
  }

  return $app.runInTransaction((txApp) => {
    const slot = txApp.findRecordById('v1_time_slots', slotId)

    if (slot.getBool('isBooked')) {
      throw new BadRequestError(
        'Este horário já foi reservado por outro usuário. Por favor, escolha outro horário.',
      )
    }

    slot.set('isBooked', true)
    slot.set('menteeName', body.name)
    slot.set('menteeEmail', body.email)
    slot.set('menteePhone', body.phone)

    txApp.save(slot)

    const offset = body.timezoneOffset !== undefined ? Number(body.timezoneOffset) : 180
    const sign = offset > 0 ? '-' : '+'
    const absOffset = Math.abs(offset)
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0')
    const minutes = String(absOffset % 60).padStart(2, '0')

    const dateStr = slot.getString('date').split(' ')[0]
    const timeStr = slot.getString('time')
    const isoString = `${dateStr} ${timeStr}:00.000${sign}${hours}:${minutes}`

    const agCol = txApp.findCollectionByNameOrId('v1_agendamentos')
    const ag = new Record(agCol)

    ag.set('data_horario', isoString)
    ag.set('status', 'Confirmado')
    ag.set('cliente_nome', body.name)
    ag.set('cliente_email', body.email)
    ag.set('cliente_telefone', body.phone)

    let menteeId = ''
    try {
      const mentee = txApp.findFirstRecordByData('v1_mentees', 'email', body.email)
      menteeId = mentee.id
      ag.set('mentee_id', menteeId)
    } catch (_) {}

    txApp.save(ag)

    const sessCol = txApp.findCollectionByNameOrId('v1_sessoes')
    const sess = new Record(sessCol)
    sess.set('date', isoString)
    sess.set('status', 'Agendada')
    sess.set('type', 'Sessão de Mentoria')
    sess.set('agendamento_id', ag.id)
    if (menteeId) {
      sess.set('mentee_id', menteeId)
    }
    try {
      const client = txApp.findFirstRecordByData('v1_clientes', 'email', body.email)
      sess.set('client_id', client.id)
    } catch (_) {}

    txApp.save(sess)

    return e.json(200, { success: true })
  })
})
