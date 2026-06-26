onRecordCreate((e) => {
  try {
    const questaoId = e.record.getString('questao_id')
    if (!questaoId) return e.next()

    const q = $app.findRecordById('v1_protensora_questoes', questaoId)
    const weight = Number(q.get('xp_acerto')) || Number(q.get('weight')) || 50

    let ansRaw = e.record.get('answer_value')
    let ans = {}
    if (typeof ansRaw === 'string') {
      try {
        ans = JSON.parse(ansRaw)
      } catch (err) {}
    } else if (ansRaw && typeof ansRaw === 'object') {
      ans = ansRaw
    }

    let s = 0
    const respCorreta = q.getString('resposta_correta')

    if (respCorreta && ans.value !== undefined && ans.value !== null && ans.value !== '') {
      if (String(ans.value).trim() === String(respCorreta).trim()) {
        s = weight
      }
    } else if (ans.value !== undefined && ans.value !== null && ans.value !== '') {
      let optsRaw = q.get('options')
      let opts = {}
      if (typeof optsRaw === 'string') {
        try {
          opts = JSON.parse(optsRaw)
        } catch (err) {}
      } else if (optsRaw && typeof optsRaw === 'object') {
        opts = optsRaw
      }
      if (opts.correct && String(ans.value).trim() === String(opts.correct).trim()) {
        s = weight
      }
    }

    e.record.set('score', s)
  } catch (err) {
    console.log('Error calculating score:', err)
  }
  e.next()
}, 'v1_protensora_respostas')

onRecordUpdate((e) => {
  try {
    const questaoId = e.record.getString('questao_id')
    if (!questaoId) return e.next()

    const q = $app.findRecordById('v1_protensora_questoes', questaoId)
    const weight = Number(q.get('xp_acerto')) || Number(q.get('weight')) || 50

    let ansRaw = e.record.get('answer_value')
    let ans = {}
    if (typeof ansRaw === 'string') {
      try {
        ans = JSON.parse(ansRaw)
      } catch (err) {}
    } else if (ansRaw && typeof ansRaw === 'object') {
      ans = ansRaw
    }

    let s = 0
    const respCorreta = q.getString('resposta_correta')

    if (respCorreta && ans.value !== undefined && ans.value !== null && ans.value !== '') {
      if (String(ans.value).trim() === String(respCorreta).trim()) {
        s = weight
      }
    } else if (ans.value !== undefined && ans.value !== null && ans.value !== '') {
      let optsRaw = q.get('options')
      let opts = {}
      if (typeof optsRaw === 'string') {
        try {
          opts = JSON.parse(optsRaw)
        } catch (err) {}
      } else if (optsRaw && typeof optsRaw === 'object') {
        opts = optsRaw
      }
      if (opts.correct && String(ans.value).trim() === String(opts.correct).trim()) {
        s = weight
      }
    }

    e.record.set('score', s)
  } catch (err) {
    console.log('Error calculating score:', err)
  }
  e.next()
}, 'v1_protensora_respostas')
