routerAdd(
  'POST',
  '/backend/v1/protensora/submit-unidade',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body
    const unidadeId = body.unidade_id
    const respostas = body.respostas

    if (!unidadeId || !respostas) return e.badRequestError('Missing data')

    const unidade = $app.findRecordById('v1_protensora_unidades', unidadeId)
    const moduloId = unidade.getString('modulo_id')
    let trilhaId = unidade.get('expand')?.modulo_id?.trilha_id
    if (!trilhaId) {
      const modulo = $app.findRecordById('v1_protensora_modulos', moduloId)
      trilhaId = modulo.getString('trilha_id')
    }

    const questoes = $app.findRecordsByFilter(
      'v1_protensora_questoes',
      `unidade_id='${unidadeId}'`,
      '-created',
      1000,
      0,
    )

    let corretas = 0
    let totalXp = 0
    const results = []
    let finalCaminho = 'normal'
    let xpGanho = 0

    try {
      $app.runInTransaction((txApp) => {
        let part
        try {
          part = txApp.findFirstRecordByFilter(
            'v1_protensora_participante_trilhas',
            `user_id='${userId}' && trilha_id='${trilhaId}'`,
          )
        } catch (_) {
          const col = txApp.findCollectionByNameOrId('v1_protensora_participante_trilhas')
          part = new Record(col)
          part.set('user_id', userId)
          part.set('trilha_id', trilhaId)
          part.set('energia', 100)
          part.set('estrelas', 0)
          part.set('xp_total', 0)
          part.set('nivel', 1)
          txApp.save(part)
        }

        if (part.getInt('energia') < 10) {
          throw new Error('ENERGIA_INSUFICIENTE')
        }

        part.set('energia', Math.max(0, part.getInt('energia') - 10))

        for (const q of questoes) {
          const qId = q.id
          const ans = respostas[qId]
          if (ans === undefined) continue

          const correta = q.getString('resposta_correta').trim()
          const isCorrect = String(ans).trim() === correta
          const xpAcerto = q.getInt('xp_acerto') || q.getInt('weight') || 50
          const score = isCorrect ? xpAcerto : 0

          if (isCorrect) {
            corretas++
            totalXp += score
          }

          let respRecord
          try {
            respRecord = txApp.findFirstRecordByFilter(
              'v1_protensora_respostas',
              `user_id='${userId}' && questao_id='${qId}'`,
            )
            respRecord.set('answer_value', { value: String(ans) })
            respRecord.set('score', score)
            txApp.save(respRecord)
          } catch (_) {
            const col = txApp.findCollectionByNameOrId('v1_protensora_respostas')
            respRecord = new Record(col)
            respRecord.set('user_id', userId)
            respRecord.set('questao_id', qId)
            respRecord.set('modulo_id', moduloId)
            respRecord.set('trilha_id', trilhaId)
            respRecord.set('answer_value', { value: String(ans) })
            respRecord.set('score', score)
            txApp.save(respRecord)
          }

          results.push({
            questao_id: qId,
            is_correct: isCorrect,
            resposta_correta: correta,
            explicacao: q.getString('explicacao'),
          })
        }

        const totalQuestoes = questoes.length
        const pct = totalQuestoes > 0 ? (corretas / totalQuestoes) * 100 : 0

        let starsToAward = 0
        if (pct < 50) {
          finalCaminho = 'reforco'
          starsToAward = 0
        } else if (pct <= 80) {
          finalCaminho = 'normal'
          starsToAward = 1
        } else if (pct < 100) {
          finalCaminho = 'avanco'
          starsToAward = 2
        } else {
          finalCaminho = 'avanco'
          starsToAward = 3
        }

        const xpUnidade = unidade.getInt('xp_conclusao') || 200
        xpGanho = xpUnidade + totalXp

        let prog
        try {
          prog = txApp.findFirstRecordByFilter(
            'v1_protensora_progresso_unidades',
            `participante_id='${userId}' && unidade_id='${unidadeId}'`,
          )
          prog.set('status', 'concluida')
          prog.set('questoes_respondidas', totalQuestoes)
          prog.set('questoes_acertadas', corretas)
          prog.set('xp_ganho', xpGanho)
          prog.set('caminho', finalCaminho)
          prog.set('video_assistido', true)
          txApp.save(prog)
        } catch (_) {
          const col = txApp.findCollectionByNameOrId('v1_protensora_progresso_unidades')
          prog = new Record(col)
          prog.set('participante_id', userId)
          prog.set('unidade_id', unidadeId)
          prog.set('status', 'concluida')
          prog.set('questoes_respondidas', totalQuestoes)
          prog.set('questoes_acertadas', corretas)
          prog.set('xp_ganho', xpGanho)
          prog.set('caminho', finalCaminho)
          prog.set('video_assistido', true)
          txApp.save(prog)
        }

        let trailProg
        try {
          trailProg = txApp.findFirstRecordByFilter(
            'v1_protensora_progresso',
            `user_id='${userId}' && trilha_id='${trilhaId}'`,
          )
          trailProg.set('score', trailProg.getInt('score') + xpGanho)
          txApp.save(trailProg)
        } catch (_) {
          const col = txApp.findCollectionByNameOrId('v1_protensora_progresso')
          trailProg = new Record(col)
          trailProg.set('user_id', userId)
          trailProg.set('trilha_id', trilhaId)
          trailProg.set('score', xpGanho)
          trailProg.set('percentage', 0)
          txApp.save(trailProg)
        }

        part.set('xp_total', part.getInt('xp_total') + xpGanho)
        part.set('estrelas', part.getInt('estrelas') + starsToAward)

        const niveis = txApp.findRecordsByFilter('v1_protensora_niveis', '', '-xp_minimo', 100, 0)
        const currentXp = part.getInt('xp_total')
        let novoNivel = 1
        for (const n of niveis) {
          if (currentXp >= n.getInt('xp_minimo')) {
            novoNivel = n.getInt('nivel')
            break
          }
        }
        part.set('nivel', novoNivel)

        txApp.save(part)
      })
    } catch (err) {
      if (err.message.includes('ENERGIA_INSUFICIENTE')) {
        return e.badRequestError('Energia insuficiente. Você precisa recarregar sua energia.')
      }
      throw err
    }

    return e.json(200, {
      corretas,
      totalXp,
      xpGanho,
      caminho: finalCaminho,
      results,
    })
  },
  $apis.requireAuth(),
)
