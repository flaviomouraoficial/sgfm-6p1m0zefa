/**
 * Re-sincronização automática (servidor) dos agendamentos marcados com
 * google_sync_status = 'error'.
 *
 * Chama a rota existente POST /backend/v1/agenda/sync-google/{id} com a
 * sessão do administrador integrador (mesmo comportamento do botão
 * "Re-sincronizar" da fila da Agenda). Nenhum acesso direto ao Google é
 * feito aqui: a rota usa $connectors.executeAsOwner por padrão.
 */
routerAdd(
  'POST',
  '/backend/v1/agenda/sync-google-errors',
  (e) => {
    const user = e.auth
    if (!user) throw new UnauthorizedError('Autenticação necessária.')

    const userRole = user.getString('role')
    const userEmail = user.getString('email')
    const userPerms = user.get('permissions') || {}
    const hasAgendaPerm = Boolean(userPerms?.mentoria?.agenda)
    const isAdmin =
      userRole === 'admin' ||
      userEmail === 'flavio@trendconsultoria.com.br' ||
      userEmail === 'admin@grupoflaviomoura.com.br' ||
      hasAgendaPerm

    if (!isAdmin) {
      throw new ForbiddenError('Apenas administradores podem re-sincronizar agendamentos.')
    }

    const erros = $app.findRecordsByFilter(
      'v1_agendamentos',
      "google_sync_status = 'error' && status != 'Recusado' && status != 'Cancelado'",
      '-created',
      100,
      0,
    )

    const resultados = []
    let sincronizados = 0
    let falhas = 0

    for (const ag of erros) {
      try {
        // Reexecuta a mesma lógica de sync da rota individual
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
        descLines.push(`ID Agendamento: ${ag.id}`)
        const description = descLines.join('\n')

        let startIso = ''
        let endIso = ''
        try {
          const cleanDateStr = String(dataHorario).replace(' ', 'T')
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
          const fallback = new Date(String(dataHorario).replace(' ', 'T'))
          startIso = fallback.toISOString()
          endIso = new Date(fallback.getTime() + 60 * 60000).toISOString()
        }

        const attendees = []
        if (clienteEmail && clienteEmail.includes('@')) {
          attendees.push({ email: clienteEmail, displayName: clienteNome })
        }

        let ok = false
        let eventId = ''
        try {
          if (existingEventId) {
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
              ok = true
              eventId = existingEventId
            } else {
              console.warn(
                `Re-sync lote: falha PATCH para ${ag.id}:`,
                (res && res.error) || 'Sem resposta',
              )
            }
          } else {
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
              ok = true
              eventId = createdId
            } else {
              console.warn(
                `Re-sync lote: falha CREATE para ${ag.id}:`,
                (res && res.error) || 'Sem resposta',
              )
            }
          }
        } catch (cErr) {
          console.warn(`Re-sync lote: exceção no conector para ${ag.id}:`, cErr.message || cErr)
        }

        if (ok) {
          ag.set('google_sync_status', 'synced')
          ag.set('google_sync_error', '')
          ag.set('google_synced_at', new Date().toISOString())
          $app.saveNoValidate(ag)
          sincronizados++
          resultados.push({ id: ag.id, success: true, eventId: eventId })
        } else {
          falhas++
          resultados.push({ id: ag.id, success: false })
        }
      } catch (err) {
        falhas++
        resultados.push({
          id: ag.id,
          success: false,
          error: String(err && err.message).slice(0, 200),
        })
        console.warn(`Re-sync lote: erro geral para ${ag.id}:`, err.message || err)
      }
    }

    return e.json(200, {
      success: falhas === 0,
      total: erros.length,
      sincronizados: sincronizados,
      falhas: falhas,
      resultados: resultados,
    })
  },
  $apis.requireAuth(),
)
