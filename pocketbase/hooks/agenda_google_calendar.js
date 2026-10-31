// ROTA 1: APROVAR AGENDAMENTO
// POST /backend/v1/agenda/aprovar/{id}
routerAdd(
  'POST',
  '/backend/v1/agenda/aprovar/{id}',
  (e) => {
    const agId = e.request.pathValue('id')
    const user = e.auth

    const userRole = user ? user.getString('role') : ''
    const userEmail = user ? user.getString('email') : ''
    const userPerms = user ? user.get('permissions') || {} : {}
    const hasAgendaPerm = Boolean(userPerms?.mentoria?.agenda)
    const isAdmin =
      userRole === 'admin' ||
      userEmail === 'flavio@trendconsultoria.com.br' ||
      userEmail === 'admin@grupoflaviomoura.com.br' ||
      hasAgendaPerm

    if (!user || !isAdmin) {
      throw new ForbiddenError('Apenas administradores podem aprovar agendamentos.')
    }

    const ag = $app.findRecordById('v1_agendamentos', agId)
    ag.set('status', 'Aprovado')
    $app.save(ag)

    // Sincronizar sessão correspondente para confirmada
    try {
      const sessoes = $app.findRecordsByFilter(
        'v1_sessoes',
        `agendamento_id = '${agId}'`,
        '-created',
        1,
        0,
      )
      if (sessoes && sessoes.length > 0) {
        const sess = sessoes[0]
        sess.set('status', 'Confirmada')
        $app.save(sess)
      } else {
        const sessCol = $app.findCollectionByNameOrId('v1_sessoes')
        const sess = new Record(sessCol)
        sess.set('date', ag.getString('data_horario'))
        sess.set('status', 'Confirmada')
        sess.set('type', 'Sessão de Mentoria')
        sess.set('agendamento_id', ag.id)
        if (ag.getString('mentee_id')) {
          sess.set('mentee_id', ag.getString('mentee_id'))
        }
        $app.save(sess)
      }
    } catch (err) {
      console.warn('Erro ao atualizar sessão ao aprovar agendamento:', err.message || err)
    }

    // Notificar o mentorado
    const clienteEmail = ag.getString('cliente_email')
    if (clienteEmail) {
      try {
        const menteeUser = $app.findFirstRecordByData('users', 'email', clienteEmail)
        const notifCol = $app.findCollectionByNameOrId('v1_notifications')
        const notif = new Record(notifCol)
        notif.set('user_id', menteeUser.id)
        notif.set('title', 'Agendamento Aprovado!')
        notif.set(
          'message',
          `Sua sessão para ${ag.getString('data_horario')} foi aprovada e confirmada pelo mentor.`,
        )
        notif.set('is_read', false)
        $app.save(notif)
      } catch (_) {}
    }

    // Sincronização Google Calendar do OWNER
    const clienteNome = ag.getString('cliente_nome') || 'Mentorado'
    const clienteTelefone = ag.getString('cliente_telefone') || ''
    const dataHorario = ag.getString('data_horario')
    const existingEventId = ag.getString('google_event_id')

    let servicoNome = 'Sessão de Mentoria'
    try {
      const servicoId = ag.getString('servico_id')
      if (servicoId) {
        const servico = $app.findRecordById('v1_servicos', servicoId)
        servicoNome = servico.getString('nome') || servicoNome
      }
    } catch (_) {}

    let menteeCompany = ''
    try {
      const menteeId = ag.getString('mentee_id')
      if (menteeId) {
        const mentee = $app.findRecordById('v1_mentees', menteeId)
        menteeCompany = mentee.getString('company') || ''
      }
    } catch (_) {}

    const summary = `Mentoria: ${clienteNome} - ${servicoNome}`
    const descLines = ['Compromisso SGFM - Grupo Flávio Moura', `Mentorado: ${clienteNome}`]
    if (clienteEmail) descLines.push(`E-mail: ${clienteEmail}`)
    if (clienteTelefone) descLines.push(`Telefone: ${clienteTelefone}`)
    if (menteeCompany) descLines.push(`Empresa: ${menteeCompany}`)
    descLines.push(`Tipo de Sessão: ${servicoNome}`)
    descLines.push(`ID Agendamento: ${agId}`)
    const description = descLines.join('\n')

    // Converter data_horario (formato "YYYY-MM-DD HH:mm:ss" ou "YYYY-MM-DDTHH:mm") considerando fuso America/Sao_Paulo (UTC-3)
    let startIso = ''
    let endIso = ''
    try {
      const cleanDateStr = dataHorario.replace(' ', 'T')
      const datePart = cleanDateStr.length === 16 ? `${cleanDateStr}:00` : cleanDateStr
      // Garantir formato ISO com offset de São Paulo se não possuir indicador de fuso
      if (!datePart.includes('Z') && !datePart.includes('+') && !datePart.includes('-', 10)) {
        const d = new Date(`${datePart}-03:00`)
        startIso = d.toISOString()
        endIso = new Date(d.getTime() + 60 * 60000).toISOString()
      } else {
        const d = new Date(datePart)
        startIso = d.toISOString()
        endIso = new Date(d.getTime() + 60 * 60000).toISOString()
      }
    } catch (_) {
      const fallback = new Date(dataHorario.replace(' ', 'T'))
      startIso = fallback.toISOString()
      endIso = new Date(fallback.getTime() + 60 * 60000).toISOString()
    }

    const attendees = []
    if (clienteEmail && clienteEmail.includes('@')) {
      attendees.push({ email: clienteEmail, displayName: clienteNome })
    }

    let syncResult = { success: false, error: '' }
    try {
      if (existingEventId) {
        console.log(
          `Atualizando evento Google Calendar ${existingEventId} para agendamento ${agId}`,
        )
        const res = $connectors.executeAsOwner('GOOGLECALENDAR_PATCH_EVENT', {
          calendar_id: 'primary',
          event_id: existingEventId,
          summary: summary,
          description: description,
          start_time: startIso,
          end_time: endIso,
          timezone: 'America/Sao_Paulo',
          attendees: attendees,
        })

        if (res && res.successful) {
          ag.set('google_sync_status', 'synced')
          ag.set('google_sync_error', '')
          ag.set('google_synced_at', new Date().toISOString())
          $app.saveNoValidate(ag)
          syncResult = { success: true, eventId: existingEventId }
        } else {
          const errMsg = (res && res.error) || 'Falha ao atualizar evento no Google Calendar'
          console.warn(`Erro na atualização do Google Calendar para agendamento ${agId}:`, errMsg)
          ag.set('google_sync_status', 'error')
          ag.set('google_sync_error', String(errMsg).slice(0, 500))
          $app.saveNoValidate(ag)
          syncResult = { success: false, error: errMsg }
        }
      } else {
        console.log(`Criando novo evento Google Calendar para agendamento ${agId}`)
        const res = $connectors.executeAsOwner('GOOGLECALENDAR_CREATE_EVENT', {
          calendar_id: 'primary',
          summary: summary,
          description: description,
          start_datetime: startIso,
          end_datetime: endIso,
          timezone: 'America/Sao_Paulo',
          attendees: attendees,
        })

        if (res && res.successful) {
          const eventData = res.data || {}
          const createdId =
            eventData.id || eventData.event_id || (eventData.data && eventData.data.id) || ''
          ag.set('google_event_id', createdId)
          ag.set('google_sync_status', 'synced')
          ag.set('google_sync_error', '')
          ag.set('google_synced_at', new Date().toISOString())
          $app.saveNoValidate(ag)
          syncResult = { success: true, eventId: createdId }
        } else {
          const errMsg = (res && res.error) || 'Falha ao criar evento no Google Calendar'
          console.warn(`Erro na criação do Google Calendar para agendamento ${agId}:`, errMsg)
          ag.set('google_sync_status', 'error')
          ag.set('google_sync_error', String(errMsg).slice(0, 500))
          $app.saveNoValidate(ag)
          syncResult = { success: false, error: errMsg }
        }
      }
    } catch (err) {
      const errMsg = (err && err.message) || String(err)
      console.warn(`Exceção no conector Google Calendar para agendamento ${agId}:`, errMsg)
      ag.set('google_sync_status', 'error')
      ag.set('google_sync_error', errMsg.slice(0, 500))
      $app.saveNoValidate(ag)
      syncResult = { success: false, error: errMsg }
    }

    return e.json(200, {
      success: true,
      message: 'Agendamento aprovado com sucesso.',
      calendarSync: syncResult,
    })
  },
  $apis.requireAuth(),
)

// ROTA 2: RECUSAR AGENDAMENTO
// POST /backend/v1/agenda/recusar/{id}
routerAdd(
  'POST',
  '/backend/v1/agenda/recusar/{id}',
  (e) => {
    const agId = e.request.pathValue('id')
    const user = e.auth
    const body = e.requestInfo().body || {}
    const motivo = body.motivo || 'Horário indisponível'

    const userRole = user ? user.getString('role') : ''
    const userEmail = user ? user.getString('email') : ''
    const userPerms = user ? user.get('permissions') || {} : {}
    const hasAgendaPerm = Boolean(userPerms?.mentoria?.agenda)
    const isAdmin =
      userRole === 'admin' ||
      userEmail === 'flavio@trendconsultoria.com.br' ||
      userEmail === 'admin@grupoflaviomoura.com.br' ||
      hasAgendaPerm

    if (!user || !isAdmin) {
      throw new ForbiddenError('Apenas administradores podem recusar agendamentos.')
    }

    const ag = $app.findRecordById('v1_agendamentos', agId)
    ag.set('status', 'Recusado')
    $app.save(ag)

    // Se havia evento no Google Calendar, remover
    const existingEventId = ag.getString('google_event_id')
    if (existingEventId) {
      try {
        console.log(`Excluindo evento Google Calendar ${existingEventId} para agendamento ${agId}`)
        const res = $connectors.executeAsOwner('GOOGLECALENDAR_DELETE_EVENT', {
          calendar_id: 'primary',
          event_id: existingEventId,
        })
        if (res && res.successful) {
          ag.set('google_sync_status', 'not_synced')
          ag.set('google_event_id', '')
          ag.set('google_sync_error', '')
          $app.saveNoValidate(ag)
        } else {
          console.warn(
            `Falha ao excluir evento Google Calendar ${existingEventId}:`,
            res ? res.error : 'Sem resposta',
          )
        }
      } catch (err) {
        console.warn(`Erro ao excluir evento Google Calendar:`, err.message || err)
      }
    }

    // Liberar o slot correspondente em v1_time_slots para outros mentorados
    try {
      const dataHorario = ag.getString('data_horario')
      if (dataHorario) {
        const dateOnly = dataHorario.split(' ')[0].split('T')[0]
        const filter = `date ~ '${dateOnly}' && isBooked = true`
        const slots = $app.findRecordsByFilter('v1_time_slots', filter, '-created', 10, 0)
        for (const slot of slots) {
          if (slot.getString('menteeEmail') === ag.getString('cliente_email')) {
            slot.set('isBooked', false)
            slot.set('menteeName', '')
            slot.set('menteeEmail', '')
            slot.set('menteePhone', '')
            $app.save(slot)
            break
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao liberar time_slot após recusa:', err.message || err)
    }

    // Cancelar sessão correspondente
    try {
      const sessoes = $app.findRecordsByFilter(
        'v1_sessoes',
        `agendamento_id = '${agId}'`,
        '-created',
        1,
        0,
      )
      for (const s of sessoes) {
        s.set('status', 'Cancelada')
        $app.save(s)
      }
    } catch (_) {}

    // Notificar o mentorado
    const clienteEmail = ag.getString('cliente_email')
    if (clienteEmail) {
      try {
        const menteeUser = $app.findFirstRecordByData('users', 'email', clienteEmail)
        const notifCol = $app.findCollectionByNameOrId('v1_notifications')
        const notif = new Record(notifCol)
        notif.set('user_id', menteeUser.id)
        notif.set('title', 'Agendamento Não Aprovado')
        notif.set(
          'message',
          `Sua solicitação de mentoria para ${ag.getString('data_horario')} não pôde ser confirmada. Motivo: ${motivo}. Por favor, escolha outro horário no portal.`,
        )
        notif.set('is_read', false)
        $app.save(notif)
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      message: 'Agendamento recusado com sucesso.',
    })
  },
  $apis.requireAuth(),
)

// ROTA 3: RETENTAR SINCRONIZAÇÃO COM GOOGLE CALENDAR
// POST /backend/v1/agenda/sync-google/{id}
routerAdd(
  'POST',
  '/backend/v1/agenda/sync-google/{id}',
  (e) => {
    const agId = e.request.pathValue('id')
    const user = e.auth

    const userRole = user ? user.getString('role') : ''
    const userEmail = user ? user.getString('email') : ''
    const userPerms = user ? user.get('permissions') || {} : {}
    const hasAgendaPerm = Boolean(userPerms?.mentoria?.agenda)
    const isAdmin =
      userRole === 'admin' ||
      userEmail === 'flavio@trendconsultoria.com.br' ||
      userEmail === 'admin@grupoflaviomoura.com.br' ||
      hasAgendaPerm

    if (!user || !isAdmin) {
      throw new ForbiddenError('Apenas administradores podem acionar a sincronização.')
    }

    const ag = $app.findRecordById('v1_agendamentos', agId)

    const clienteNome = ag.getString('cliente_nome') || 'Mentorado'
    const clienteEmail = ag.getString('cliente_email') || ''
    const clienteTelefone = ag.getString('cliente_telefone') || ''
    const dataHorario = ag.getString('data_horario')
    const existingEventId = ag.getString('google_event_id')

    let servicoNome = 'Sessão de Mentoria'
    try {
      const servicoId = ag.getString('servico_id')
      if (servicoId) {
        const servico = $app.findRecordById('v1_servicos', servicoId)
        servicoNome = servico.getString('nome') || servicoNome
      }
    } catch (_) {}

    let menteeCompany = ''
    try {
      const menteeId = ag.getString('mentee_id')
      if (menteeId) {
        const mentee = $app.findRecordById('v1_mentees', menteeId)
        menteeCompany = mentee.getString('company') || ''
      }
    } catch (_) {}

    const summary = `Mentoria: ${clienteNome} - ${servicoNome}`
    const descLines = ['Compromisso SGFM - Grupo Flávio Moura', `Mentorado: ${clienteNome}`]
    if (clienteEmail) descLines.push(`E-mail: ${clienteEmail}`)
    if (clienteTelefone) descLines.push(`Telefone: ${clienteTelefone}`)
    if (menteeCompany) descLines.push(`Empresa: ${menteeCompany}`)
    descLines.push(`Tipo de Sessão: ${servicoNome}`)
    descLines.push(`ID Agendamento: ${agId}`)
    const description = descLines.join('\n')

    // Converter data_horario considerando fuso America/Sao_Paulo (UTC-3)
    let startIso = ''
    let endIso = ''
    try {
      const cleanDateStr = dataHorario.replace(' ', 'T')
      const datePart = cleanDateStr.length === 16 ? `${cleanDateStr}:00` : cleanDateStr
      if (!datePart.includes('Z') && !datePart.includes('+') && !datePart.includes('-', 10)) {
        const d = new Date(`${datePart}-03:00`)
        startIso = d.toISOString()
        endIso = new Date(d.getTime() + 60 * 60000).toISOString()
      } else {
        const d = new Date(datePart)
        startIso = d.toISOString()
        endIso = new Date(d.getTime() + 60 * 60000).toISOString()
      }
    } catch (_) {
      const fallback = new Date(dataHorario.replace(' ', 'T'))
      startIso = fallback.toISOString()
      endIso = new Date(fallback.getTime() + 60 * 60000).toISOString()
    }

    const attendees = []
    if (clienteEmail && clienteEmail.includes('@')) {
      attendees.push({ email: clienteEmail, displayName: clienteNome })
    }

    let syncResult = { success: false, error: '' }
    try {
      if (existingEventId) {
        console.log(
          `Atualizando evento Google Calendar ${existingEventId} para agendamento ${agId}`,
        )
        const res = $connectors.executeAsOwner('GOOGLECALENDAR_PATCH_EVENT', {
          calendar_id: 'primary',
          event_id: existingEventId,
          summary: summary,
          description: description,
          start_time: startIso,
          end_time: endIso,
          timezone: 'America/Sao_Paulo',
          attendees: attendees,
        })

        if (res && res.successful) {
          ag.set('google_sync_status', 'synced')
          ag.set('google_sync_error', '')
          ag.set('google_synced_at', new Date().toISOString())
          $app.saveNoValidate(ag)
          syncResult = { success: true, eventId: existingEventId }
        } else {
          const errMsg = (res && res.error) || 'Falha ao atualizar evento no Google Calendar'
          console.warn(`Erro na atualização do Google Calendar para agendamento ${agId}:`, errMsg)
          ag.set('google_sync_status', 'error')
          ag.set('google_sync_error', String(errMsg).slice(0, 500))
          $app.saveNoValidate(ag)
          syncResult = { success: false, error: errMsg }
        }
      } else {
        console.log(`Criando novo evento Google Calendar para agendamento ${agId}`)
        const res = $connectors.executeAsOwner('GOOGLECALENDAR_CREATE_EVENT', {
          calendar_id: 'primary',
          summary: summary,
          description: description,
          start_datetime: startIso,
          end_datetime: endIso,
          timezone: 'America/Sao_Paulo',
          attendees: attendees,
        })

        if (res && res.successful) {
          const eventData = res.data || {}
          const createdId =
            eventData.id || eventData.event_id || (eventData.data && eventData.data.id) || ''
          ag.set('google_event_id', createdId)
          ag.set('google_sync_status', 'synced')
          ag.set('google_sync_error', '')
          ag.set('google_synced_at', new Date().toISOString())
          $app.saveNoValidate(ag)
          syncResult = { success: true, eventId: createdId }
        } else {
          const errMsg = (res && res.error) || 'Falha ao criar evento no Google Calendar'
          console.warn(`Erro na criação do Google Calendar para agendamento ${agId}:`, errMsg)
          ag.set('google_sync_status', 'error')
          ag.set('google_sync_error', String(errMsg).slice(0, 500))
          $app.saveNoValidate(ag)
          syncResult = { success: false, error: errMsg }
        }
      }
    } catch (err) {
      const errMsg = (err && err.message) || String(err)
      console.warn(`Exceção no conector Google Calendar para agendamento ${agId}:`, errMsg)
      ag.set('google_sync_status', 'error')
      ag.set('google_sync_error', errMsg.slice(0, 500))
      $app.saveNoValidate(ag)
      syncResult = { success: false, error: errMsg }
    }

    return e.json(200, {
      success: syncResult.success,
      sync: syncResult,
    })
  },
  $apis.requireAuth(),
)

// ROTA 4: CONSULTAR STATUS DO CONECTOR GOOGLE CALENDAR
// GET /backend/v1/agenda/google-calendar/status
routerAdd(
  'GET',
  '/backend/v1/agenda/google-calendar/status',
  (e) => {
    const user = e.auth
    if (!user) {
      throw new UnauthorizedError('Autenticação necessária.')
    }

    let connected = false
    let email = ''
    let details = null
    let error = null

    try {
      const res = $connectors.executeAsOwner('GOOGLECALENDAR_GET_CURRENT_USER', {})
      if (res && res.successful) {
        connected = true
        const data = res.data || {}
        email = data.email || data.primaryCalendarId || data.id || 'flaviofrancomoura@gmail.com'
        details = data
      } else {
        connected = false
        error = 'Conta não conectada. Conecte em Configurações > Google Calendar.'
      }
    } catch (err) {
      connected = false
      // NUNCA expor erro bruto de conector/provedor ao cliente
      error = 'Conta não conectada. Conecte em Configurações > Google Calendar.'
    }

    return e.json(200, {
      connected: connected,
      email: email,
      targetEmail: 'flaviofrancomoura@gmail.com',
      details: details,
      error: error,
    })
  },
  $apis.requireAuth(),
)

// HOOK ON RECORD UPDATE: SE O AGENDAMENTO FOR REMARCADO OU CANCELADO NO BANCO
onRecordAfterUpdateSuccess((e) => {
  const ag = e.record
  const status = ag.getString('status')
  const eventId = ag.getString('google_event_id')

  if (!eventId) return e.next()

  if (status === 'Cancelado' || status === 'Recusado') {
    try {
      console.log(`Cancelando evento Google Calendar ${eventId} para agendamento ${ag.id}`)
      $connectors.executeAsOwner('GOOGLECALENDAR_DELETE_EVENT', {
        calendar_id: 'primary',
        event_id: eventId,
      })
      ag.set('google_sync_status', 'not_synced')
      ag.set('google_event_id', '')
      ag.set('google_sync_error', '')
      $app.saveNoValidate(ag)
    } catch (err) {
      console.warn('Erro ao cancelar evento Google Calendar:', err.message || err)
    }
  } else if (status === 'Aprovado' || status === 'Confirmado') {
    const originalDate = ag.original().getString('data_horario')
    const currentDate = ag.getString('data_horario')
    if (originalDate !== currentDate) {
      try {
        let startIso = ''
        let endIso = ''
        const cleanDateStr = currentDate.replace(' ', 'T')
        const datePart = cleanDateStr.length === 16 ? `${cleanDateStr}:00` : cleanDateStr
        if (!datePart.includes('Z') && !datePart.includes('+') && !datePart.includes('-', 10)) {
          const d = new Date(`${datePart}-03:00`)
          startIso = d.toISOString()
          endIso = new Date(d.getTime() + 60 * 60000).toISOString()
        } else {
          const d = new Date(datePart)
          startIso = d.toISOString()
          endIso = new Date(d.getTime() + 60 * 60000).toISOString()
        }
        $connectors.executeAsOwner('GOOGLECALENDAR_PATCH_EVENT', {
          calendar_id: 'primary',
          event_id: eventId,
          start_time: startIso,
          end_time: endIso,
          timezone: 'America/Sao_Paulo',
        })
      } catch (err) {
        console.warn('Erro ao atualizar data no Google Calendar:', err.message || err)
      }
    }
  }

  return e.next()
}, 'v1_agendamentos')

onRecordAfterDeleteSuccess((e) => {
  const ag = e.record
  const eventId = ag.getString('google_event_id')
  if (eventId) {
    try {
      console.log(`Removendo evento Google Calendar ${eventId} devido à exclusão do agendamento`)
      $connectors.executeAsOwner('GOOGLECALENDAR_DELETE_EVENT', {
        calendar_id: 'primary',
        event_id: eventId,
      })
    } catch (err) {
      console.warn(
        'Erro ao excluir evento Google Calendar no hook de exclusão:',
        err.message || err,
      )
    }
  }
  return e.next()
}, 'v1_agendamentos')
