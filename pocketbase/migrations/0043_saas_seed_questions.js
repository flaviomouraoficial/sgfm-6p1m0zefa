migrate(
  (app) => {
    const diags = app.findRecordsByFilter('v1_saas_diagnostics', '1=1', '', 100, 0)
    const qCol = app.findCollectionByNameOrId('v1_saas_questions')

    for (const diag of diags) {
      const type = diag.getString('type')
      let qs = []
      if (type === 'prisma') {
        const dims = ['Execução', 'Relacionamento', 'Comportamento', 'Potencial']
        dims.forEach((dim) => {
          for (let i = 1; i <= 9; i++)
            qs.push({
              dimension: dim,
              text: `Como você avalia seu desempenho em: ${dim} - aspecto ${i}?`,
              order: i,
            })
        })
      } else if (type === 'strategic_360') {
        const dims = [
          'Clareza',
          'Pessoas',
          'Processos',
          'Indicadores',
          'Execução',
          'Clima',
          'Remuneração',
          'Feedback',
        ]
        dims.forEach((dim) => {
          for (let i = 1; i <= 4; i++)
            qs.push({ dimension: dim, text: `Avalie ${dim} - prática ${i}`, order: i })
        })
      } else if (type === 'gestao') {
        const dims = ['Governança', 'Equipe', 'Processos', 'Resultados']
        dims.forEach((dim) => {
          for (let i = 1; i <= 15; i++)
            qs.push({
              dimension: dim,
              text: `A prática ${i} da área de ${dim} está plenamente implementada?`,
              order: i,
            })
        })
      }

      qs.forEach((q, idx) => {
        const record = new Record(qCol)
        record.set('diagnostic', diag.id)
        record.set('dimension', q.dimension)
        record.set('text', q.text)
        record.set('order', idx + 1)
        app.save(record)
      })
    }
  },
  (app) => {},
)
