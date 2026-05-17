routerAdd(
  'POST',
  '/backend/v1/book-slot/{id}',
  (e) => {
    const slotId = e.request.pathValue('id')
    const user = e.auth

    if (
      !user ||
      (user.getString('role') !== 'mentee' &&
        user.getString('role') !== 'admin' &&
        user.getString('email') !== 'flavio@trendconsultoria.com.br')
    ) {
      throw new ForbiddenError('Apenas usuários autorizados podem agendar sessões via portal.')
    }

    return $app.runInTransaction((txApp) => {
      const slot = txApp.findRecordById('v1_time_slots', slotId)
      if (slot.getBool('isBooked')) {
        throw new BadRequestError('Este horário já foi reservado por outro usuário.')
      }

      let menteeId = ''
      let menteeName = user.getString('name') || user.getString('email').split('@')[0]
      let menteeEmail = user.getString('email')

      try {
        const mentee = txApp.findFirstRecordByData('v1_mentees', 'email', user.getString('email'))
        menteeId = mentee.id
        menteeName = mentee.getString('name')
        menteeEmail = mentee.getString('email')
      } catch (_) {
        throw new BadRequestError(
          'Registro de mentorado não encontrado para o seu usuário. Contate o suporte.',
        )
      }

      slot.set('isBooked', true)
      slot.set('menteeName', menteeName)
      slot.set('menteeEmail', menteeEmail)

      txApp.save(slot)

      const agCol = txApp.findCollectionByNameOrId('v1_agendamentos')
      const ag = new Record(agCol)
      ag.set('mentee_id', menteeId)

      const dateStr = slot.getString('date').split(' ')[0]
      const timeStr = slot.getString('time')

      ag.set('data_horario', `${dateStr} ${timeStr}:00.000Z`)
      ag.set('status', 'Agendado')
      ag.set('cliente_nome', menteeName)
      ag.set('cliente_email', menteeEmail)

      txApp.save(ag)

      return e.json(200, { success: true })
    })
  },
  $apis.requireAuth(),
)
