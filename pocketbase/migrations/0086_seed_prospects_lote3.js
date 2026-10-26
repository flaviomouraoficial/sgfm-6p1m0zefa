migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('v1_deals')

    const deals = [
      {
        title: 'Liderança de primeira linha — Grupo VRA',
        clientName: 'Grupo VRA / Atacadista Mega (MS)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor-alvo: Head de RH. Sem e-mail público — contato via LinkedIn. Texto pronto em artifacts/lote3_abordagens.md. Gancho: atacarejo 9 lojas em 6 cidades, rotatividade de primeira linha.',
      },
      {
        title: 'Integração e liderança — Usina Cedro',
        clientName: 'Usina Cedro / Grupo Pedra (MS)',
        stage: 'contact',
        email: 'recrutamentocedro@uspedra.com.br',
        notes:
          'Decisor-alvo: Gerente de RH. E-mail enviado 26/10/2026 (caixa de recrutamento oficial). Gancho: usina inaugurada 2025, equipe recém-formada, ~1.200 empregos. Follow-up D+4: 30/10.',
      },
      {
        title: 'Coordenadores de fazenda — Bom Futuro',
        clientName: 'Grupo Bom Futuro (MT)',
        stage: 'contact',
        email: 'marketing@bomfuturo.com.br',
        notes:
          'Decisor-alvo: Gerente de RH. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: maior produtor de algodão do MT, operações pulverizadas. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança industrial 24/7 — Inpasa',
        clientName: 'Inpasa Agroindustrial (MT)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor-alvo: Head de RH. Sem e-mail público (e-mail fiscal descartado) — contato via LinkedIn. Texto pronto em artifacts/lote3_abordagens.md. Gancho: maior produtora de etanol de milho da América Latina, operação 24/7.',
      },
      {
        title: 'Gestão de times técnicos — Dental Morelli',
        clientName: 'Dental Morelli (SP)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor-alvo: Head de RH. Sem e-mail público — contato via LinkedIn. Texto pronto em artifacts/lote3_abordagens.md. Gancho: indústria odontológica de alta tecnologia, gestão de engenheiros e técnicos.',
      },
      {
        title: 'Padrão de gestão em 2 regiões — Bahamas',
        clientName: 'Grupo Bahamas (MG)',
        stage: 'contact',
        email: 'sac@bahamas.com.br',
        notes:
          'Decisor-alvo: Head de RH. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: 88 lojas em duas regiões de MG — padronização de liderança. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança no ramp-up — Udi Refrescos',
        clientName: 'Uberlândia Refrescos / Coca-Cola (MG)',
        stage: 'lead',
        email: '',
        notes:
          'Decisor-alvo: Head de RH. Sem e-mail público (e-mail de imprensa descartado) — contato via LinkedIn. Texto pronto em artifacts/lote3_abordagens.md. Gancho: R$ 2,1 bi de investimento, 8 mil empregos previstos.',
      },
      {
        title: 'Estrutura de T&D — Superpão',
        clientName: 'Supermercados Superpão (PR)',
        stage: 'contact',
        email: 'faleconosco@superpao.com.br',
        notes:
          'Decisor-alvo: Head de RH. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: rede regional sem T&D dedicado — F7 vira o T&D deles. Follow-up D+4: 30/10.',
      },
      {
        title: 'Liderança técnica — Giacomini',
        clientName: 'Giacomini Ferramentaria (PR)',
        stage: 'contact',
        email: 'contato@giacomini.ind.br',
        notes:
          'Contato: Antonio Giacomini Neto, Gerente Comercial. E-mail enviado 26/10/2026 (e-mail oficial). Gancho: maior ferramentaria do norte do PR, liderança técnica de precisão. Follow-up D+4: 30/10.',
      },
      {
        title: 'Integração nas lojas novas — Grupo Koch',
        clientName: 'Grupo Koch (SC)',
        stage: 'contact',
        email: 'sac@grupokochsa.com.br',
        notes:
          'Decisor: Alisson Pereira dos Santos, Gerente Executivo de RH. E-mail enviado 26/10/2026 (e-mail genérico oficial). Gancho: 8ª maior rede do Brasil, expansão no Vale do Itajaí, gestão humanizada. Follow-up D+4: 30/10.',
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
      'Liderança de primeira linha — Grupo VRA',
      'Integração e liderança — Usina Cedro',
      'Coordenadores de fazenda — Bom Futuro',
      'Liderança industrial 24/7 — Inpasa',
      'Gestão de times técnicos — Dental Morelli',
      'Padrão de gestão em 2 regiões — Bahamas',
      'Liderança no ramp-up — Udi Refrescos',
      'Estrutura de T&D — Superpão',
      'Liderança técnica — Giacomini',
      'Integração nas lojas novas — Grupo Koch',
    ]
    for (const t of titles) {
      const recs = app.findRecordsByFilter(col, `title = "${t}"`, '', 100, 0)
      for (const r of recs) app.delete(r)
    }
  },
)
