onRecordAfterUpdateSuccess((e) => {
  const isCompleted = e.record.getBool('completed')
  const wasCompleted = e.record.original().getBool('completed')

  if (!isCompleted || wasCompleted) return e.next()

  const userId = e.record.getString('user_id')
  const trilhaId = e.record.getString('trilha_id')

  let partTrilha
  try {
    partTrilha = $app.findFirstRecordByFilter(
      'v1_protensora_participante_trilhas',
      `user_id='${userId}' && trilha_id='${trilhaId}'`,
    )
    if (partTrilha.getString('status') !== 'concluido') {
      partTrilha.set('status', 'concluido')
      partTrilha.set('completed_at', new Date().toISOString())
      $app.save(partTrilha)
    }
  } catch (_) {}

  // Check if certificate already exists
  try {
    $app.findFirstRecordByFilter(
      'v1_protensora_certificados',
      `user_id='${userId}' && trilha_id='${trilhaId}'`,
    )
    return e.next() // already issued
  } catch (_) {}

  const trilha = $app.findRecordById('v1_protensora_trilhas', trilhaId)
  const minScore = trilha.getInt('min_score_certificate') || 70

  const modulos = $app.findRecordsByFilter(
    'v1_protensora_modulos',
    `trilha_id='${trilhaId}'`,
    '',
    1000,
    0,
  )
  const moduloIds = modulos.map((m) => m.id)

  let maxScore = 0
  if (moduloIds.length > 0) {
    const filter = moduloIds.map((id) => `modulo_id='${id}'`).join(' || ')
    const qs = $app.findRecordsByFilter('v1_protensora_questoes', filter, '', 10000, 0)
    maxScore = qs.reduce((sum, q) => sum + (Number(q.get('xp_acerto')) || 50), 0)
  }

  const userScore = e.record.getInt('score') || 0
  const scorePct = maxScore > 0 ? (userScore / maxScore) * 100 : 100

  if (scorePct >= minScore) {
    const trilhaName = trilha.getString('name') || 'Trilha'
    const codigo = $security.randomString(12).toUpperCase()

    const certCol = $app.findCollectionByNameOrId('v1_protensora_certificados')
    const certRecord = new Record(certCol)
    certRecord.set('user_id', userId)
    certRecord.set('trilha_id', trilhaId)
    certRecord.set('issue_date', new Date().toISOString())
    certRecord.set('final_score', scorePct)
    certRecord.set('codigo_verificacao', codigo)
    $app.save(certRecord)

    try {
      const notifCol = $app.findCollectionByNameOrId('v1_notifications')
      const notif = new Record(notifCol)
      notif.set('user_id', userId)
      notif.set('title', 'Certificado Emitido! 🎉')
      notif.set('message', `Parabéns! Seu certificado da trilha ${trilhaName} já está disponível.`)
      notif.set('is_read', false)
      $app.save(notif)
    } catch (err) {}
  }

  return e.next()
}, 'v1_protensora_progresso')
