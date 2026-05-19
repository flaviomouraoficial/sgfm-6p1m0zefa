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

      const body = e.requestInfo().body || {}
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
      ag.set('mentee_id', menteeId)
      ag.set('data_horario', isoString)
      ag.set('status', 'Confirmado')
      ag.set('cliente_nome', menteeName)
      ag.set('cliente_email', menteeEmail)

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

      txApp.save(sess)

      return e.json(200, { success: true })
    })
  },
  $apis.requireAuth(),
)
