migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_deals')

    const deals = [
      {
        title: 'Formação de gestores de loja — Bistek',
        clientName: 'Bistek (SC)',
        stage: 'contact',
        email: 'sanciro@bistek.com.br',
        notes:
          'Decisor: Sanciro, Diretor de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: varejo SC — liderança de primeira linha. Follow-up D+4: 30/10.',
      },
      {
        title: 'Lideranças farmacêuticas — Biolab',
        clientName: 'Biolab Farma',
        stage: 'contact',
        email: 'rgomes@biolabfarma.com.br',
        notes:
          'Decisor: Raquel Gomes, Diretora de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: liderança de times técnicos/científicos. Follow-up D+4: 30/10.',
      },
      {
        title: 'Sucessão e gestão — Libbs',
        clientName: 'Libbs',
        stage: 'contact',
        email: 'madalena.ribeiro@libbs.com.br',
        notes:
          'Decisor: Madalena Ribeiro, Diretora de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: empresa familiar — sucessão + mentoria executiva (R$ 45.000). Follow-up D+4: 30/10.',
      },
      {
        title: 'Formação contínua — Eurofarma',
        clientName: 'Eurofarma',
        stage: 'contact',
        email: 'daniela.panagassi@eurofarma.com.br',
        notes:
          'Decisor: Daniela Panagassi, Diretora de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: complemento de programas internos. Follow-up D+4: 30/10.',
      },
      {
        title: 'Gerentes e sucessão — Sup. Pinheiro',
        clientName: 'Supermercado Pinheiro',
        stage: 'contact',
        email: 'xeniapinheiro@supermercadopinheiro.com.br',
        notes:
          'Decisor: Xenia Pinheiro, Diretora de Gestão e Pessoas. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: rede familiar — sucessão + gerentes de loja. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança para crescimento — Agro Lógica',
        clientName: 'Agro Lógica',
        stage: 'contact',
        email: 'adriana.veiga@agrologica.com.br',
        notes:
          'Decisor: Adriana Camargo Veiga, Head de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: agro em crescimento — meio da pirâmide. Follow-up D+4: 30/10.',
      },
      {
        title: 'Lideranças na cooperativa — 3tentos',
        clientName: '3tentos (RS)',
        stage: 'contact',
        email: 'camila.schneider@3tentos.com.br',
        notes:
          'Decisor: Camila Schneider, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: cooperativa grande — unidades distribuídas. Follow-up D+4: 30/10.',
      },
      {
        title: 'Formação de supervisores — Cotrijal',
        clientName: 'Cotrijal (RS)',
        stage: 'contact',
        email: 'simoner@cotrijal.com.br',
        notes:
          'Decisor: Simone Rohrig, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: supervisores de produção e campo. Follow-up D+4: 30/10.',
      },
      {
        title: 'Programa de liderança — Messer',
        clientName: 'Messer',
        stage: 'contact',
        email: 'erica.pincinato@messer-br.com',
        notes:
          'Decisor: Érica Pincinato, Coordenadora de T&D/HRBP (compradora direta). Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: liderança industrial pronta para aplicar. Follow-up D+4: 30/10.',
      },
      {
        title: 'Lideranças nas operações — Lar',
        clientName: 'Lar Cooperativa (RS)',
        stage: 'contact',
        email: 'fabiane@lar.ind.br',
        notes:
          'Decisor: Fabiane Poletto, Gerente de RH. Fonte: base Ramper (98%). E-mail enviado 26/10/2026. Gancho: padrão de liderança entre operações múltiplas. Follow-up D+4: 30/10.',
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
      'Formação de gestores de loja — Bistek',
      'Lideranças farmacêuticas — Biolab',
      'Sucessão e gestão — Libbs',
      'Formação contínua — Eurofarma',
      'Gerentes e sucessão — Sup. Pinheiro',
      'Liderança para crescimento — Agro Lógica',
      'Lideranças na cooperativa — 3tentos',
      'Formação de supervisores — Cotrijal',
      'Programa de liderança — Messer',
      'Lideranças nas operações — Lar',
    ]
    for (const t of titles) {
      const recs = app.findRecordsByFilter(col, `title = "${t}"`, '', 100, 0)
      for (const r of recs) app.delete(r)
    }
  },
)
