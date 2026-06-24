onRecordAfterCreateSuccess((e) => {
  const trilhaId = e.record.getString('trilha_id')
  const userId = e.record.getString('user_id')

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

  try {
    const progresso = $app.findFirstRecordByFilter(
      'v1_protensora_progresso',
      `user_id = '${userId}' && trilha_id = '${trilhaId}'`,
    )
    progresso.set('percentage', percentage)
    progresso.set('score', totalScore)
    progresso.set('completed', percentage >= 100)
    $app.save(progresso)
  } catch (_) {
    const col = $app.findCollectionByNameOrId('v1_protensora_progresso')
    const progresso = new Record(col)
    progresso.set('user_id', userId)
    progresso.set('trilha_id', trilhaId)
    progresso.set('percentage', percentage)
    progresso.set('score', totalScore)
    progresso.set('completed', percentage >= 100)
    $app.save(progresso)
  }
  e.next()
}, 'v1_protensora_respostas')
