routerAdd('POST', '/backend/v1/public-book-slot/{id}', (e) => {
  const slotId = e.request.pathValue('id')
  const body = e.requestInfo().body || {}

  if (!body.name || !body.email || !body.phone) {
    throw new BadRequestError('Nome, email e telefone são obrigatórios.')
  }

  return $app.runInTransaction((txApp) => {
    const slot = txApp.findRecordById('v1_time_slots', slotId)

    if (slot.getBool('isBooked')) {
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

    let offset = 180
    if (body.timezoneOffset !== undefined && body.timezoneOffset !== null) {
      offset = Number(body.timezoneOffset)
    }
    const sign = offset > 0 ? '-' : '+'
    const absOffset = Math.abs(offset)
    let hours = String(Math.floor(absOffset / 60))
    if (hours.length < 2) hours = '0' + hours
    let minutes = String(absOffset % 60)
    if (minutes.length < 2) minutes = '0' + minutes

    const dateStr = slot.getString('date').split(' ')[0]
    const timeStr = slot.getString('time')
    const isoString = dateStr + ' ' + timeStr + ':00.000' + sign + hours + ':' + minutes

    let existingAgId = null
    try {
      const filter = "cliente_email = '" + body.email + "' && data_horario = '" + isoString + "'"
      const existingAgs = txApp.findRecordsByFilter('v1_agendamentos', filter, '-created', 1, 0)
      if (existingAgs && existingAgs.length > 0) {
        existingAgId = existingAgs[0].id
      }
    } catch (err) {}

    let menteeId = ''
    try {
      const mentee = txApp.findFirstRecordByData('v1_mentees', 'email', body.email)
      menteeId = mentee.id
    } catch (err) {}

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

    let existingSessId = null
    try {
      const sessFilter = "agendamento_id = '" + existingAgId + "'"
      const existingSess = txApp.findRecordsByFilter('v1_sessoes', sessFilter, '-created', 1, 0)
      if (existingSess && existingSess.length > 0) {
        existingSessId = existingSess[0].id
      }
    } catch (err) {}

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
      } catch (err) {}

      txApp.save(sess)
    }

    return e.json(200, { success: true })
  })
})
