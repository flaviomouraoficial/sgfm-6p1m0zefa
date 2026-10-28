migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_deals')

    const deals = [
      {
        title: 'Liderança em grupo multinegócio — Agronelli',
        clientName: 'Agronelli (MG)',
        stage: 'contact',
        email: 'adriana.vitorio@agronelli.com.br',
        notes:
          'Decisor: Adriana Vitorio, Gerente Corporativa de Gente & Gestão e SSMA. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: grupo de R$ 630 mi, 3 unidades de negócio (Soluções, Fazendas, bebidas Porto Real), reestruturação de gestão para mercado de capitais. Follow-up D+4: 01/11.',
      },
      {
        title: 'O próximo degrau depois do GPTW — Alibra',
        clientName: 'Alibra Ingredientes (SP)',
        stage: 'contact',
        email: 'leomar.thiel@alibra.com.br',
        notes:
          'Decisor: Leomar André Thiel, Coordenador de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: ingredientes lácteos, +600 colaboradores, GPTW — formar liderança intermediária. Follow-up D+4: 01/11.',
      },
      {
        title: 'Do commodity ao produto especial — Nita',
        clientName: 'Nita Alimentos (SP)',
        stage: 'contact',
        email: 'fernanda.chinaglia@nita.com.br',
        notes:
          'Decisor: Fernanda Chinaglia, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: moinho desde 1968, 329 colab., virada de farinha commodity para produtos especiais (Bloomberg Linea out/2026). Follow-up D+4: 01/11.',
      },
      {
        title: 'Supervisor de turno como ponto de virada — Special Dog',
        clientName: 'Manfrim / Special Dog (SP)',
        stage: 'contact',
        email: 'fabia.carvalho@manfrim.com.br',
        notes:
          'Decisor: Fabia Carvalho, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: indústria de alimentação animal desde 1967, ~980 colab., multi-planta SP/MG, exportação. Follow-up D+4: 01/11.',
      },
      {
        title: 'Quadro dobrado em quatro anos — Casul',
        clientName: 'Casul (SP)',
        stage: 'contact',
        email: 'matheushenrique@casul.com.br',
        notes:
          'Decisor: Matheus Garcia, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: cooperativa de 1960, +3.700 cooperados, 11 filiais SP/MS, quadro 262→504 (2020-2024). Follow-up D+4: 01/11.',
      },
      {
        title: 'Gerente de filial: vender e liderar — Ordemilk',
        clientName: 'Ordemilk (SC)',
        stage: 'contact',
        email: 'adyone@ordemilk.com.br',
        notes:
          'Decisor: Adyone Peres, Supervisora de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: equipamentos de ordenha/suinocultura, fundada 1999, ~158 colab., filiais em 6 estados. Follow-up D+4: 01/11.',
      },
      {
        title: 'Liderar a operação de rua — Sorocaba Refrescos',
        clientName: 'Sorocaba Refrescos (SP)',
        stage: 'contact',
        email: 'efiel@sorocabarefrescos.com.br',
        notes:
          'Decisor: Elaine Fiel, Supervisora de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: franquia Coca-Cola desde 1975, 1.200 colab., 60 municípios, +18 mil clientes, selo Lugares Incríveis. Follow-up D+4: 01/11.',
      },
      {
        title: 'Gerente de loja entre família e operação — Moniari',
        clientName: 'Super Moniari (SC)',
        stage: 'contact',
        email: 'karina@moniari.com.br',
        notes:
          'Decisor: Karina Dal Pont Zilli, Coordenadora de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: rede familiar desde 1990, 9 lojas em 6 cidades, +700 colab., 2ª geração Pizzetti. Follow-up D+4: 01/11.',
      },
      {
        title: 'Um padrão de liderança para 17 marcas — Fortbras',
        clientName: 'Fortbras (MG)',
        stage: 'contact',
        email: 'drielle.santos@fortbras.com.br',
        notes:
          'Decisor: Ielle Santos, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: maior rede de autopeças do país (Advent), 17 marcas regionais, 252 lojas, +5.000 colab. Follow-up D+4: 01/11.',
      },
      {
        title: 'Denominador comum de liderança em 12 empresas — GJA',
        clientName: 'Grupo José Alves (GO)',
        stage: 'contact',
        email: 'zelia.santos@grupojosealves.com',
        notes:
          'Decisor: Zélia Cristina Santos, Gerente de Treinamento e Benefícios. Fonte: base Ramper (98%). E-mail enviado 28/10/2026. Gancho: holding GO, 12 empresas em 9 segmentos, ~7 mil colab., R$ 3,7 bi. Follow-up D+4: 01/11.',
      },
    ]

    for (const d of deals) {
      const existing = app.findRecordsByFilter(col, `title = "${d.title}"`, '', 1, 0)
      if (existing.length > 0) continue
      const rec = new Record(col)
      rec.set('title', d.title)
      rec.set('clientName', d.clientName)
      rec.set('value', 5280)
      rec.set('stage', d.stage)
      rec.set('email', d.email)
      rec.set('notes', d.notes)
      app.save(rec)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('v1_deals')
    const titles = [
      'Liderança em grupo multinegócio — Agronelli',
      'O próximo degrau depois do GPTW — Alibra',
      'Do commodity ao produto especial — Nita',
      'Supervisor de turno como ponto de virada — Special Dog',
      'Quadro dobrado em quatro anos — Casul',
      'Gerente de filial: vender e liderar — Ordemilk',
      'Liderar a operação de rua — Sorocaba Refrescos',
      'Gerente de loja entre família e operação — Moniari',
      'Um padrão de liderança para 17 marcas — Fortbras',
      'Denominador comum de liderança em 12 empresas — GJA',
    ]
    for (const t of titles) {
      const recs = app.findRecordsByFilter(col, `title = "${t}"`, '', 100, 0)
      for (const r of recs) app.delete(r)
    }
  },
)
