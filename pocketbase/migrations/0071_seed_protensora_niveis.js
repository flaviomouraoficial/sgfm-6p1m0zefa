migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_protensora_niveis')

    const niveis = [
      { nivel: 1, titulo: 'Iniciante Curioso', xp_minimo: 0, xp_maximo: 500 },
      { nivel: 2, titulo: 'Estudante Focado', xp_minimo: 501, xp_maximo: 1500 },
      { nivel: 3, titulo: 'Explorador de Dados', xp_minimo: 1501, xp_maximo: 3000 },
      { nivel: 4, titulo: 'Gestor Tático', xp_minimo: 3001, xp_maximo: 6000 },
      { nivel: 5, titulo: 'Mestre Estratégico', xp_minimo: 6001, xp_maximo: 10000 },
    ]

    for (const n of niveis) {
      try {
        app.findFirstRecordByData('v1_protensora_niveis', 'nivel', n.nivel)
      } catch (_) {
        const record = new Record(col)
        record.set('nivel', n.nivel)
        record.set('titulo', n.titulo)
        record.set('xp_minimo', n.xp_minimo)
        record.set('xp_maximo', n.xp_maximo)
        app.save(record)
      }
    }
  },
  (app) => {},
)
