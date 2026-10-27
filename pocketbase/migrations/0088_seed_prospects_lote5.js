migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_deals')

    const deals = [
      {
        title: 'Liderança no crescimento — Portal Agro',
        clientName: 'Portal Agro (PA)',
        stage: 'contact',
        email: 'janine.silva@portalagro.agr.br',
        notes:
          'Decisor: Janine Souza da Silva, Coordenadora de RH Sênior. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: insumos + armazenagem + transporte + ATR — liderança por frente. Follow-up D+4: 31/10.',
      },
      {
        title: 'Padrão de liderança nas 55 unidades — Cravil',
        clientName: 'Cravil (SC)',
        stage: 'contact',
        email: 'marina@cravil.com.br',
        notes:
          'Decisor: Marina Pontes, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: 50 anos, ~1.000 colaboradores, 55 unidades em 39 municípios. Follow-up D+4: 31/10.',
      },
      {
        title: 'Liderança na operação e franquias — Jadlog',
        clientName: 'Jadlog (SP)',
        stage: 'contact',
        email: 'nestor.de@jadlog.com.br',
        notes:
          'Decisor: Nestor de Souza, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: ~7.000 colaboradores, +500 franquias, +4.000 Pickup. Follow-up D+4: 31/10.',
      },
      {
        title: 'Do técnico ao gestor — Maximplant',
        clientName: 'Maximplant (SP)',
        stage: 'contact',
        email: 'debora@maximplant.com.br',
        notes:
          'Decisor: Debora Silva, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: distribuidora de implantes — gerente técnico + time comercial. Follow-up D+4: 31/10.',
      },
      {
        title: 'Estrutura de liderança para a próxima fase — AvantiAgro',
        clientName: 'AvantiAgro (RS)',
        stage: 'contact',
        email: 'vanessa.silveira@avantiagro.com.br',
        notes:
          'Decisor: Vanessa Pereira Silveira, Coordenadora de RH e Marketing. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: empresa jovem, 2 UBS de sementes, crescimento. Follow-up D+4: 31/10.',
      },
      {
        title: 'Parceria em liderança — Safras e Cifras',
        clientName: 'Safras & Cifras (RS)',
        stage: 'contact',
        email: 'anselmo.larocca@safrasecifras.com.br',
        notes:
          'Decisor: Anselmo Rocca, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: PARCERIA/INDICAÇÃO — consultoria de agro familiar, +300 profissionais, +4.500 famílias. Canal de geração de demanda. Follow-up D+4: 31/10.',
      },
      {
        title: 'Liderança de campo na pecuária — Balbino',
        clientName: 'Agro Antonio Balbino (BA)',
        stage: 'contact',
        email: 'tatyana.tigre@balbinosagro.com.br',
        notes:
          'Decisor: Tatyana Tigre, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: 30 anos seleção Nelore, Oeste Baiano, coordenação de campo. Follow-up D+4: 31/10.',
      },
      {
        title: 'Gerente de loja na expansão — Cabana Burger',
        clientName: 'Cabana Burger (SP)',
        stage: 'contact',
        email: 'aquiza@cabanaburger.com.br',
        notes:
          'Decisor: Áquiza Souza, Treinamento e Desenvolvimento. Fonte: base Ramper (98%). E-mail enviado 27/10/2026. Gancho: 24 operações próprias, franquia desde 2023, meta de 300 lojas. Follow-up D+4: 31/10.',
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
      'Liderança no crescimento — Portal Agro',
      'Padrão de liderança nas 55 unidades — Cravil',
      'Liderança na operação e franquias — Jadlog',
      'Do técnico ao gestor — Maximplant',
      'Estrutura de liderança para a próxima fase — AvantiAgro',
      'Parceria em liderança — Safras e Cifras',
      'Liderança de campo na pecuária — Balbino',
      'Gerente de loja na expansão — Cabana Burger',
    ]
    for (const t of titles) {
      const recs = app.findRecordsByFilter(col, `title = "${t}"`, '', 100, 0)
      for (const r of recs) app.delete(r)
    }
  },
)
