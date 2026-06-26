routerAdd(
  'GET',
  '/backend/v1/protensora/ranking',
  (e) => {
    const records = $app.findRecordsByFilter(
      'v1_protensora_participante_trilhas',
      '1=1',
      '',
      10000,
      0,
    )
    $apis.enrichRecords(e, records, 'user_id')

    const map = new Map()
    for (const r of records) {
      const uid = r.getString('user_id')
      const user = r.expandedOne('user_id')
      if (!user) continue

      if (!map.has(uid)) {
        map.set(uid, {
          id: uid,
          name: user.getString('name') || 'Aluno Anônimo',
          avatar: user.getString('avatar'),
          collectionId: user.collectionId(),
          xp_total: 0,
          estrelas: 0,
          nivel_max: 0,
        })
      }
      const stat = map.get(uid)
      stat.xp_total += r.getInt('xp_total') || 0
      stat.estrelas += r.getInt('estrelas') || 0
      stat.nivel_max = Math.max(stat.nivel_max, r.getInt('nivel') || 0)
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      if (b.xp_total !== a.xp_total) return b.xp_total - a.xp_total
      return b.nivel_max - a.nivel_max
    })

    return e.json(200, {
      items: sorted.slice(0, 100),
    })
  },
  $apis.requireAuth(),
)
