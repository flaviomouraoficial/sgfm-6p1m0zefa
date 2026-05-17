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

    const agCol = txApp.findCollectionByNameOrId('v1_agendamentos')
    const ag = new Record(agCol)

    const dateStr = slot.getString('date').split(' ')[0]
    const timeStr = slot.getString('time')

    ag.set('data_horario', `${dateStr} ${timeStr}:00.000Z`)
    ag.set('status', 'Confirmado')
    ag.set('cliente_nome', body.name)
    ag.set('cliente_email', body.email)
    ag.set('cliente_telefone', body.phone)

    try {
      const mentee = txApp.findFirstRecordByData('v1_mentees', 'email', body.email)
      ag.set('mentee_id', mentee.id)
    } catch (_) {}

    txApp.save(ag)

    return e.json(200, { success: true })
  })
})
