onRecordAfterCreateSuccess((e) => {
  const trilhaId = e.record.getString('trilha_id')
  const userId = e.record.getString('user_id')
  const moduloId = e.record.getString('modulo_id')

  const modulos = $app.findRecordsByFilter(
    'v1_protensora_modulos',
    `trilha_id = '${trilhaId}'`,
    '',
    1000,
    0,
  )
  const moduloIds = modulos.map((m) => m.id)

  let totalQuestoes = 0
  if (moduloIds.length > 0) {
    const filter = moduloIds.map((id) => `modulo_id='${id}'`).join(' || ')
    totalQuestoes = $app.countRecords('v1_protensora_questoes', filter)
  }

  const answeredQuestoes = $app.countRecords(
    'v1_protensora_respostas',
    `user_id = '${userId}' && trilha_id = '${trilhaId}'`,
  )
  const respostas = $app.findRecordsByFilter(
    'v1_protensora_respostas',
    `user_id = '${userId}' && trilha_id = '${trilhaId}'`,
    '',
    10000,
    0,
  )
  const totalScore = respostas.reduce((sum, r) => sum + (Number(r.get('score')) || 0), 0)

  const percentage = totalQuestoes > 0 ? (answeredQuestoes / totalQuestoes) * 100 : 0
  const isCompleted = percentage >= 100

  let progresso
  try {
    progresso = $app.findFirstRecordByFilter(
      'v1_protensora_progresso',
      `user_id = '${userId}' && trilha_id = '${trilhaId}'`,
    )
    progresso.set('percentage', percentage)
    progresso.set('score', totalScore)
    progresso.set('completed', isCompleted)
    $app.save(progresso)
  } catch (_) {
    const col = $app.findCollectionByNameOrId('v1_protensora_progresso')
    progresso = new Record(col)
    progresso.set('user_id', userId)
    progresso.set('trilha_id', trilhaId)
    progresso.set('percentage', percentage)
    progresso.set('score', totalScore)
    progresso.set('completed', isCompleted)
    $app.save(progresso)
  }

  try {
    const participante = $app.findFirstRecordByFilter(
      'v1_protensora_participante_trilhas',
      `user_id = '${userId}' && trilha_id = '${trilhaId}'`,
    )

    const newXp = Number(e.record.get('score')) || 0
    const currentXpTotal = Number(participante.get('xp_total')) || 0
    participante.set('xp_total', currentXpTotal + newXp)

    if (isCompleted) {
      participante.set('status', 'concluido')
      if (!participante.get('completed_at')) {
        participante.set('completed_at', new Date().toISOString())
      }
    }

    const niveis = $app.findRecordsByFilter('v1_protensora_niveis', '1=1', '-nivel', 100, 0)
    let newLevel = 1
    for (const n of niveis) {
      if (currentXpTotal + newXp >= n.getInt('xp_minimo')) {
        newLevel = n.getInt('nivel')
        break
      }
    }
    const oldLevel = participante.getInt('nivel') || 1
    participante.set('nivel', newLevel)
    if (newLevel > oldLevel) {
      participante.set('estrelas', (participante.getInt('estrelas') || 0) + (newLevel - oldLevel))
    }

    $app.save(participante)
  } catch (err) {
    console.log('participante trilha não encontrado para o user', userId)
  }

  function award(reqType, tId) {
    const conquistas = $app.findRecordsByFilter(
      'v1_protensora_conquistas',
      `requirement_type='${reqType}'`,
      '',
      1,
      0,
    )
    if (!conquistas.length) return
    const c = conquistas[0]
    try {
      const filterStr = tId
        ? `user_id='${userId}' && conquista_id='${c.id}' && trail_id='${tId}'`
        : `user_id='${userId}' && conquista_id='${c.id}' && trail_id=''`
      $app.findFirstRecordByFilter('v1_protensora_conquistas_usuario', filterStr)
    } catch (_) {
      const col = $app.findCollectionByNameOrId('v1_protensora_conquistas_usuario')
      const rec = new Record(col)
      rec.set('user_id', userId)
      rec.set('conquista_id', c.id)
      if (tId) rec.set('trail_id', tId)
      rec.set('earned_at', new Date().toISOString())
      $app.save(rec)

      try {
        const notifCol = $app.findCollectionByNameOrId('v1_notifications')
        const notif = new Record(notifCol)
        notif.set('user_id', userId)
        notif.set('title', 'Nova Conquista Desbloqueada!')
        notif.set('message', `Você ganhou a conquista: ${c.getString('name')}`)
        notif.set('is_read', false)
        $app.save(notif)
      } catch (err) {
        console.log(err)
      }
    }
  }

  award('first_step', null)

  const moduleQs = $app.countRecords('v1_protensora_questoes', `modulo_id='${moduloId}'`)
  const answeredModQs = $app.countRecords(
    'v1_protensora_respostas',
    `user_id='${userId}' && modulo_id='${moduloId}'`,
  )

  if (moduleQs > 0 && answeredModQs >= moduleQs) {
    award('module_done', trilhaId)

    const qs = $app.findRecordsByFilter(
      'v1_protensora_questoes',
      `modulo_id='${moduloId}'`,
      '',
      1000,
      0,
    )
    const maxScore = qs.reduce((sum, q) => sum + (Number(q.get('weight')) || 1), 0)
    const rs = $app.findRecordsByFilter(
      'v1_protensora_respostas',
      `user_id='${userId}' && modulo_id='${moduloId}'`,
      '',
      1000,
      0,
    )
    const userScore = rs.reduce((sum, r) => sum + (Number(r.get('score')) || 0), 0)

    if (userScore >= maxScore && maxScore > 0) {
      award('perfect_score', trilhaId)
    }
  }

  if (isCompleted) {
    award('trail_master', trilhaId)
  }

  e.next()
}, 'v1_protensora_respostas')
