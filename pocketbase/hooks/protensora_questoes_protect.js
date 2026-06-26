onRecordListRequest((e) => {
  if (e.hasSuperuserAuth() || e.auth?.role === 'admin') return e.next()
  for (let i = 0; i < e.result.items.length; i++) {
    e.result.items[i].set('resposta_correta', '')
    e.result.items[i].set('explicacao', '')
  }
  return e.next()
}, 'v1_protensora_questoes')

onRecordViewRequest((e) => {
  if (e.hasSuperuserAuth() || e.auth?.role === 'admin') return e.next()
  e.result.set('resposta_correta', '')
  e.result.set('explicacao', '')
  return e.next()
}, 'v1_protensora_questoes')
