migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_deals')

    const deals = [
      {
        title: 'Formação de gerentes — Tauste',
        clientName: 'Tauste Supermercados (SP)',
        stage: 'contact',
        email: 'tauste@tauste.com.br',
        notes:
          'Decisor: Andrei Nacagawa, Diretor Administrativo. E-mail enviado 26/10/2026. Gancho: expansão contínua + CD próprio. Follow-up D+4: 30/10.',
      },
      {
        title: 'Gestão para rede afiliada — Martins/Smart',
        clientName: 'Grupo Martins / Rede Smart (MG)',
        stage: 'contact',
        email: 'smart@martins.com.br',
        notes:
          'Decisor: Rubens Batista, Diretor Geral (CEO). E-mail enviado 26/10/2026. Gancho: programa de liderança para +300 lojas afiliadas — potencial de contrato plataforma. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança industrial — Schulz',
        clientName: 'Schulz S.A. (SC)',
        stage: 'contact',
        email: 'recrutamento@schulz.com.br',
        notes:
          'Decisor: José Francisco Reitz, Gerente de RH (desde 2005). E-mail enviado 26/10/2026 (caixa RH oficial). Gancho: supervisores de chão de fábrica + capacitação contínua declarada. Follow-up D+4: 30/10.',
      },
      {
        title: 'Sucessão e gestão — ZEN S.A.',
        clientName: 'ZEN S.A. Indústria Metalúrgica (SC)',
        stage: 'contact',
        email: 'atendimento@zensa.com.br',
        notes:
          'Decisor: André Luiz Zen, Diretor Geral (família). E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: sucessão em empresa familiar + mentoria executiva (ticket R$ 45.000). Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança nas 15 regionais — Integrada',
        clientName: 'Integrada Cooperativa Agroindustrial (PR)',
        stage: 'contact',
        email: 'sac@integrada.coop.br',
        notes:
          'Decisor: Tatiana Rumiato, Gerente de RH. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: padronização de liderança entre 15 regionais. Follow-up D+4: 30/10.',
      },
      {
        title: 'Formação de supervisores — Coopavel',
        clientName: 'Coopavel Cooperativa Agroindustrial (PR)',
        stage: 'contact',
        email: 'coopavel@coopavel.com.br',
        notes:
          'Decisor: Aguinel Waclawovsky, Gerente de RH (20 anos de casa). E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: operações diversificadas (indústria, agro, aves). Follow-up D+4: 30/10.',
      },
      {
        title: 'Gerentes e sucessão — Supermercados Pires',
        clientName: 'Supermercados Pires (MS)',
        stage: 'contact',
        email: 'contato@supermercadospires.com.br',
        notes:
          'Decisor: Manoel Pires, Diretor. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: rede familiar 37 lojas — sucessão + gerentes de loja. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança na safra — Usina Alta Mogiana',
        clientName: 'Usina Alta Mogiana (SP)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor: Vera Martins Guedes, Diretora de Pessoas e Jurídico (LinkedIn: linkedin.com/in/vera-martins-guedes-797aba23). Sem e-mail direto — contato via LinkedIn. Texto pronto em artifacts/lote2_abordagens.md. Gancho: 31 anos de casa, TOP 3 RH do setor sucroenergético.',
      },
      {
        title: 'Liderança para expansão — Grupo Imesul',
        clientName: 'Grupo Imesul (MS)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor: Samuel Veraldi, Diretor de Distribuição (LinkedIn: linkedin.com/in/samuel-veraldi-junio-veraldi-75497433). Sem e-mail no site — contato via LinkedIn. Texto pronto em artifacts/lote2_abordagens.md. Gancho: 45+ anos, expansão com novas filiais.',
      },
      {
        title: 'Formação de lideranças — Amaggi',
        clientName: 'Amaggi (MT)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor: Nereu Bavaresco, Diretor de Gente e Gestão. Sem e-mail público — contato via LinkedIn. Texto pronto em artifacts/lote2_abordagens.md. Gancho: RH top 10 Brasil — módulos in company como complemento.',
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
      'Formação de gerentes — Tauste',
      'Gestão para rede afiliada — Martins/Smart',
      'Liderança industrial — Schulz',
      'Sucessão e gestão — ZEN S.A.',
      'Liderança nas 15 regionais — Integrada',
      'Formação de supervisores — Coopavel',
      'Gerentes e sucessão — Supermercados Pires',
      'Liderança na safra — Usina Alta Mogiana',
      'Liderança para expansão — Grupo Imesul',
      'Formação de lideranças — Amaggi',
    ]
    for (const t of titles) {
      const recs = app.findRecordsByFilter(col, `title = "${t}"`, '', 100, 0)
      for (const r of recs) app.delete(r)
    }
  },
)
