routerAdd('POST', '/backend/v1/public-book-slot/{id}', (e) => {
  const slotId = e.request.pathValue('id')
  const body = e.requestInfo().body

  if (!body || !body.name || !body.email || !body.phone) {
    throw new BadRequestError('Nome, email e telefone são obrigatórios.')
  }

  return $app.runInTransaction((txApp) => {
    const slot = txApp.findRecordById('v1_time_slots', slotId)

    if (slot.getBool('isBooked')) {
      // Indempotency check: if already booked by the SAME email, just return success
      if (slot.getString('menteeEmail') === body.email) {
        return e.json(200, { success: true, message: 'Already booked' })
      }
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

    // Deduplicate: check if an agendamento already exists for this email and time
    let existingAgId = null
    try {
      const existingAgs = txApp.findRecordsByFilter(
        'v1_agendamentos',
        `cliente_email = '${body.email}' && data_horario = '${isoString}'`,
        '',
        1,
        0,
      )
      if (existingAgs && existingAgs.length > 0) {
        existingAgId = existingAgs[0].id
      }
    } catch (_) {}

    let menteeId = ''
    try {
      const mentee = txApp.findFirstRecordByData('v1_mentees', 'email', body.email)
      menteeId = mentee.id
    } catch (_) {}

    if (!existingAgId) {
      const agCol = txApp.findCollectionByNameOrId('v1_agendamentos')
      const ag = new Record(agCol)

      ag.set('data_horario', isoString)
      ag.set('status', 'Confirmado')
      ag.set('cliente_nome', body.name)
      ag.set('cliente_email', body.email)
      ag.set('cliente_telefone', body.phone)

      if (menteeId) {
        ag.set('mentee_id', menteeId)
      }

      txApp.save(ag)
      existingAgId = ag.id
    }

    // Deduplicate session
    let existingSessId = null
    try {
      const existingSess = txApp.findRecordsByFilter(
        'v1_sessoes',
        `agendamento_id = '${existingAgId}'`,
        '',
        1,
        0,
      )
      if (existingSess && existingSess.length > 0) {
        existingSessId = existingSess[0].id
      }
    } catch (_) {}

    if (!existingSessId) {
      const sessCol = txApp.findCollectionByNameOrId('v1_sessoes')
      const sess = new Record(sessCol)
      sess.set('date', isoString)
      sess.set('status', 'Agendada')
      sess.set('type', 'Sessão de Mentoria')
      sess.set('agendamento_id', existingAgId)
      if (menteeId) {
        sess.set('mentee_id', menteeId)
      }
      try {
        const client = txApp.findFirstRecordByData('v1_clientes', 'email', body.email)
        sess.set('client_id', client.id)
      } catch (_) {}

      txApp.save(sess)
    }

    return e.json(200, { success: true })
  })
})
