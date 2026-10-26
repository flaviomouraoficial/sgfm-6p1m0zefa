migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_deals')

    const deals = [
      {
        title: 'Treinamento de liderança — Savegnago',
        clientName: 'Savegnago Supermercados (SP)',
        stage: 'contact',
        email: 'jaciani.rizziolli@savegnago.com.br',
        notes:
          'Decisor: Jaciani Rizziolli, Diretora de Gestão de Pessoas. E-mail enviado 26/10/2026. Gancho: 6 lojas novas/ano + retenção de talentos. Follow-up D+4: 30/10.',
      },
      {
        title: 'Desenvolvimento de lideranças — Frísia',
        clientName: 'Frísia Cooperativa Agroindustrial (PR)',
        stage: 'contact',
        email: 'sheyla.bachega@frisia.coop.br',
        notes:
          'Decisor: Sheyla Bachega, CHRO (empossada 2026). E-mail enviado 26/10/2026. Gancho: transformação cultural + planejamento 2027. Follow-up D+4: 30/10.',
      },
      {
        title: 'Formação de gestores de loja — Angeloni',
        clientName: 'Angeloni (SC)',
        stage: 'contact',
        email: 'rhangeloni@angeloni.com.br',
        notes:
          'Decisor: Anete Wainstein Paiva, Diretora de Gente & Gestão. E-mail enviado 26/10/2026 (caixa RH oficial). Gancho: 68 unidades em SC e PR. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança industrial — Grupo Krona',
        clientName: 'Grupo Krona (SC)',
        stage: 'contact',
        email: 'contato@krona.com.br',
        notes:
          'Decisor: Samuel Francisco, Head de RH/CHRO (orçamento R$ 3 mi/ano). E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: supervisores de produção nas 7 fábricas. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança de loja — DelMoro',
        clientName: 'DelMoro Supermercados (MT)',
        stage: 'contact',
        email: 'escritorio@delmoro.com.br',
        notes:
          'Decisor: Marcia Luzia Zefiro, Gerente Adm. de Pessoas. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: cultura declarada "nosso maior diferencial está nas pessoas". Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança rural — GMS Agronegócios',
        clientName: 'GMS Agronegócios (MT)',
        stage: 'contact',
        email: 'gms@gmsagro.com.br',
        notes:
          'Decisor: Clarineu Júnior, Head de Gente e Gestão. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: RH recém-estruturado + equipes rurais em 3 municípios. Follow-up D+4: 30/10.',
      },
      {
        title: 'Desenvolvimento de gestores — Giassi',
        clientName: 'Giassi Supermercados (SC)',
        stage: 'contact',
        email: 'contato@giassi.com.br',
        notes:
          'Decisor: Andrei Passig, Diretor de RH. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: compras centralizadas de T&D. Follow-up D+4: 30/10.',
      },
      {
        title: 'Treinamento de liderança — Grupo ABV',
        clientName: 'Grupo ABV / Abevê Supermercados (MS)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor: Joaquim Ribeiro, Gerente de RH (LinkedIn: linkedin.com/in/joaquim-ribeiro-b7b135160). Texto de conexão pronto em artifacts/lote1_abordagens.md. Gancho: expansão Leve+ SuperAtacado.',
      },
      {
        title: 'Integração de times novos — SuperMaxi',
        clientName: 'SuperMaxi Supermercados (MG)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor: Milson Borges dos Santos, Diretor-Presidente (site institucional). Texto de 1ª mensagem pronto em artifacts/lote1_abordagens.md. Gancho: R$ 70 mi de investimento + 300 contratações em 2026.',
      },
      {
        title: 'Formação de lideranças — Cocamar',
        clientName: 'Cocamar Cooperativa Agroindustrial (PR)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor: Elza Carnelossi, Gerente Executiva de Gestão de Pessoas (LinkedIn: linkedin.com/in/elza-carnelossi-461b05208). Sem e-mail público — contato via LinkedIn. Gancho: dobra de tamanho a cada 5 anos.',
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
      'Treinamento de liderança — Savegnago',
      'Desenvolvimento de lideranças — Frísia',
      'Formação de gestores de loja — Angeloni',
      'Liderança industrial — Grupo Krona',
      'Liderança de loja — DelMoro',
      'Liderança rural — GMS Agronegócios',
      'Desenvolvimento de gestores — Giassi',
      'Treinamento de liderança — Grupo ABV',
      'Integração de times novos — SuperMaxi',
      'Formação de lideranças — Cocamar',
    ]
    for (const t of titles) {
      const recs = app.findRecordsByFilter(col, `title = "${t}"`, '', 100, 0)
      for (const r of recs) app.delete(r)
    }
  },
)
