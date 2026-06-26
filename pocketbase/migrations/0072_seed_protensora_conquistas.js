migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_protensora_conquistas')

    const conquistas = [
      {
        name: 'Primeiro Passo',
        requirement_type: 'first_step',
        requirement_value: 1,
        description: 'Concluiu a primeira aula',
        icon: 'Footprints',
      },
      {
        name: 'Sempre na Média',
        requirement_type: 'module_done',
        requirement_value: 1,
        description: 'Concluiu um módulo inteiro',
        icon: 'Award',
      },
      {
        name: '100% de Aproveitamento',
        requirement_type: 'perfect_score',
        requirement_value: 1,
        description: 'Acertou todas de um quiz',
        icon: 'Star',
      },
      {
        name: 'Mestre da Trilha',
        requirement_type: 'trail_master',
        requirement_value: 1,
        description: 'Concluiu uma trilha',
        icon: 'Trophy',
      },
    ]

    for (const c of conquistas) {
      try {
        app.findFirstRecordByData('v1_protensora_conquistas', 'name', c.name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', c.name)
        record.set('requirement_type', c.requirement_type)
        record.set('requirement_value', c.requirement_value)
        record.set('description', c.description)
        record.set('icon', c.icon)
        app.save(record)
      }
    }
  },
  (app) => {},
)
