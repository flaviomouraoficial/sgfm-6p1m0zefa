onRecordCreate((e) => {
  try {
    const q = $app.findRecordById('v1_protensora_questoes', e.record.getString('questao_id'))
    const weight = Number(q.get('weight')) || 1
    const ans = e.record.get('answer_value') || {}
    let s = 0
    if (q.getString('type') === 'multiple_choice') {
      const opts = q.get('options') || {}
      if (opts.correct && ans.value === opts.correct) s = weight
      else if (!opts.correct && ans.value) s = weight
    } else {
      if (ans.value && String(ans.value).trim() !== '') s = weight
    }
    e.record.set('score', s)
  } catch (err) {
    console.log('Error calculating score:', err)
  }
  e.next()
}, 'v1_protensora_respostas')

onRecordUpdate((e) => {
  try {
    const q = $app.findRecordById('v1_protensora_questoes', e.record.getString('questao_id'))
    const weight = Number(q.get('weight')) || 1
    const ans = e.record.get('answer_value') || {}
    let s = 0
    if (q.getString('type') === 'multiple_choice') {
      const opts = q.get('options') || {}
      if (opts.correct && ans.value === opts.correct) s = weight
      else if (!opts.correct && ans.value) s = weight
    } else {
      if (ans.value && String(ans.value).trim() !== '') s = weight
    }
    e.record.set('score', s)
  } catch (err) {
    console.log('Error calculating score:', err)
  }
  e.next()
}, 'v1_protensora_respostas')
