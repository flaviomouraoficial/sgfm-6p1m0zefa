onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = e.record.original()

  const oldXp = original.getInt('xp_ganho') || 0
  const newXp = record.getInt('xp_ganho') || 0
  const diffXp = newXp - oldXp

  if (diffXp > 0) {
    const userId = record.getString('participante_id')
    try {
      const unidade = $app.findRecordById('v1_protensora_unidades', record.getString('unidade_id'))
      const modulo = $app.findRecordById('v1_protensora_modulos', unidade.getString('modulo_id'))
      const trilhaId = modulo.getString('trilha_id')

      let partTrilha
      try {
        partTrilha = $app.findFirstRecordByFilter(
          'v1_protensora_participante_trilhas',
          'user_id={:uid} && trilha_id={:tid}',
          { uid: userId, tid: trilhaId },
        )
      } catch (_) {
        const col = $app.findCollectionByNameOrId('v1_protensora_participante_trilhas')
        partTrilha = new Record(col)
        partTrilha.set('user_id', userId)
        partTrilha.set('trilha_id', trilhaId)
        partTrilha.set('xp_total', 0)
        partTrilha.set('nivel', 1)
        partTrilha.set('energia', 100)
        partTrilha.set('estrelas', 0)
        partTrilha.set('status', 'ativo')
      }

      const totalXp = (partTrilha.getInt('xp_total') || 0) + diffXp
      partTrilha.set('xp_total', totalXp)

      const niveis = $app.findRecordsByFilter('v1_protensora_niveis', '1=1', '-nivel', 100, 0)
      let newLevel = 1
      for (const n of niveis) {
        if (totalXp >= n.getInt('xp_minimo')) {
          newLevel = n.getInt('nivel')
          break
        }
      }

      const oldLevel = partTrilha.getInt('nivel') || 1
      partTrilha.set('nivel', newLevel)
      if (newLevel > oldLevel) {
        partTrilha.set('estrelas', (partTrilha.getInt('estrelas') || 0) + (newLevel - oldLevel))
      }

      $app.save(partTrilha)
    } catch (err) {
      $app.logger().error('Error updating XP', 'error', err.message)
    }
  }

  e.next()
}, 'v1_protensora_progresso_unidades')

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const newXp = record.getInt('xp_ganho') || 0

  if (newXp > 0) {
    const userId = record.getString('participante_id')
    try {
      const unidade = $app.findRecordById('v1_protensora_unidades', record.getString('unidade_id'))
      const modulo = $app.findRecordById('v1_protensora_modulos', unidade.getString('modulo_id'))
      const trilhaId = modulo.getString('trilha_id')

      let partTrilha
      try {
        partTrilha = $app.findFirstRecordByFilter(
          'v1_protensora_participante_trilhas',
          'user_id={:uid} && trilha_id={:tid}',
          { uid: userId, tid: trilhaId },
        )
      } catch (_) {
        const col = $app.findCollectionByNameOrId('v1_protensora_participante_trilhas')
        partTrilha = new Record(col)
        partTrilha.set('user_id', userId)
        partTrilha.set('trilha_id', trilhaId)
        partTrilha.set('xp_total', 0)
        partTrilha.set('nivel', 1)
        partTrilha.set('energia', 100)
        partTrilha.set('estrelas', 0)
        partTrilha.set('status', 'ativo')
      }

      const totalXp = (partTrilha.getInt('xp_total') || 0) + newXp
      partTrilha.set('xp_total', totalXp)

      const niveis = $app.findRecordsByFilter('v1_protensora_niveis', '1=1', '-nivel', 100, 0)
      let newLevel = 1
      for (const n of niveis) {
        if (totalXp >= n.getInt('xp_minimo')) {
          newLevel = n.getInt('nivel')
          break
        }
      }

      const oldLevel = partTrilha.getInt('nivel') || 1
      partTrilha.set('nivel', newLevel)
      if (newLevel > oldLevel) {
        partTrilha.set('estrelas', (partTrilha.getInt('estrelas') || 0) + (newLevel - oldLevel))
      }

      $app.save(partTrilha)
    } catch (err) {
      $app.logger().error('Error updating XP on create', 'error', err.message)
    }
  }

  e.next()
}, 'v1_protensora_progresso_unidades')
