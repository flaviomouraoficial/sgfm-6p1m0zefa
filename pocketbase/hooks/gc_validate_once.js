// TEMPORÁRIO: cron one-shot para validar a habilitação owner do conector
// Google Calendar e disparar a re-sincronização em lote dos agendamentos
// com google_sync_status = 'error'. Este arquivo será REMOVIDO na entrega.
cronAdd(
  'gc_validate_once',
  '*/2 * * * *',
  () => {
    console.log('[gc_validate_once] iniciando validação do conector owner')

    try {
      const list = $connectors.executeAsOwner('GOOGLECALENDAR_LIST_CALENDARS', { max_results: 3 })
      const items = (list && list.data && list.data.items) || []
      const count = Array.isArray(items) ? items.length : 0
      const first = count > 0 ? items[0] : null
      const firstId = first ? first.id || first.summary || '' : ''
      console.log(`[gc_validate_once] LIST_CALENDARS ok, ${count} calendários, primary=${firstId}`)
    } catch (err) {
      console.error(`[gc_validate_once] LIST_CALENDARS falhou:`, err.message || err)
      return
    }

    const erros = $app.findRecordsByFilter(
      'v1_agendamentos',
      "google_sync_status = 'error' && status != 'Recusado' && status != 'Cancelado'",
      '-created',
      100,
      0,
    )
    console.log(`[gc_validate_once] agendamentos com erro para re-sincronizar: ${erros.length}`)

    for (const ag of erros) {
      try {
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

        const summary = `Mentoria: ${clienteNome} - ${servicoNome}`
        const descLines = ['Compromisso SGFM - Grupo Flávio Moura', `Mentorado: ${clienteNome}`]
        if (clienteEmail) descLines.push(`E-mail: ${clienteEmail}`)
        if (clienteTelefone) descLines.push(`Telefone: ${clienteTelefone}`)
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
                `[gc_validate_once] falha PATCH ${ag.id}:`,
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
                `[gc_validate_once] falha CREATE ${ag.id}:`,
                (res && res.error) || 'Sem resposta',
              )
            }
          }
        } catch (cErr) {
          console.warn(`[gc_validate_once] exceção no conector ${ag.id}:`, cErr.message || cErr)
        }

        if (ok) {
          ag.set('google_sync_status', 'synced')
          ag.set('google_sync_error', '')
          ag.set('google_synced_at', new Date().toISOString())
          $app.saveNoValidate(ag)
          console.log(`[gc_validate_once] sincronizado ${ag.id} evento=${eventId}`)
        }
      } catch (err) {
        console.warn(`[gc_validate_once] erro geral ${ag.id}:`, err.message || err)
      }
    }

    console.log('[gc_validate_once] concluído')
  },
  $os.getenv('SKIP_SUPERUSER_EMAIL') || '',
)
