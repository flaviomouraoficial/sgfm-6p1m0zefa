cronAdd('commercial_followup_reminder', '0 7 * * *', () => {
  const todayStr = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'

  // Buscar reuniões comerciais onde data_proximo_contato <= hoje e resultado != 'Fechou' e != 'Não qualificado'
  // No PocketBase v1_reunioes_comerciais, data_proximo_contato é texto ('YYYY-MM-DD' ou similar)
  let reunioes = []
  try {
    reunioes = $app.findRecordsByFilter(
      'v1_reunioes_comerciais',
      `data_proximo_contato != '' && data_proximo_contato <= '${todayStr}' && resultado != 'Fechou' && resultado != 'Não qualificado'`,
      '-data_proximo_contato',
      200,
      0,
    )
  } catch (err) {
    $app.logger().error('commercial_followup_reminder: error querying meetings', 'err', err.message)
    return
  }

  if (!reunioes || reunioes.length === 0) {
    $app.logger().info('commercial_followup_reminder: no pending follow-ups for today')
    return
  }

  // Descobrir vendedores/admins responsáveis para receber as notificações
  let targetUsers = []
  try {
    targetUsers = $app.findRecordsByFilter(
      'users',
      `role = 'admin' || permissions ~ 'crm'`,
      '',
      50,
      0,
    )
  } catch (err) {
    $app
      .logger()
      .error('commercial_followup_reminder: error querying target users', 'err', err.message)
  }

  if (targetUsers.length === 0) {
    try {
      targetUsers = $app.findRecordsByFilter('users', `role = 'admin'`, '', 10, 0)
    } catch (_) {}
  }

  if (targetUsers.length === 0) return

  const notifCol = $app.findCollectionByNameOrId('v1_notifications')

  // Para evitar criar notificações duplicadas no mesmo dia para a mesma reunião,
  // verificamos se já foi gerada notificação hoje com o nome do lead
  reunioes.forEach((r) => {
    const leadNome = r.getString('lead_nome') || 'Lead'
    const empresa = r.getString('empresa') || ''
    const proximoPasso = r.getString('proximo_passo') || 'Fazer contato'
    const dataContato = r.getString('data_proximo_contato')
    const atrasado = dataContato < todayStr

    const title = atrasado
      ? `🚨 Follow-up Atrasado: ${leadNome}`
      : `📅 Follow-up de Hoje: ${leadNome}`

    const message = `Follow-up com ${leadNome}${empresa ? ` (${empresa})` : ''} agendado para ${dataContato}. Próximo passo: ${proximoPasso}.`

    targetUsers.forEach((u) => {
      try {
        // Verificar se já existe notificação não lida idêntica hoje
        const existing = $app.findRecordsByFilter(
          'v1_notifications',
          `user_id = '${u.id}' && title = '${title}' && is_read = false`,
          '',
          1,
          0,
        )
        if (existing.length === 0) {
          const notif = new Record(notifCol)
          notif.set('user_id', u.id)
          notif.set('title', title)
          notif.set('message', message)
          notif.set('is_read', false)
          $app.save(notif)
        }
      } catch (err) {
        $app
          .logger()
          .error('commercial_followup_reminder: failed to create notif', 'err', err.message)
      }
    })
  })

  $app.logger().info('commercial_followup_reminder: completed', 'meetingsChecked', reunioes.length)
})
