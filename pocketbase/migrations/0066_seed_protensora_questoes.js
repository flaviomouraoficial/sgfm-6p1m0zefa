migrate(
  (app) => {
    const seedData = [
      {
        CATEGORIA: 'Gestão Estratégica',
        TEMA: 'Fundamentos da Estratégia',
        ORDEM: 1,
        QUESTAO: 'Qual é o principal objetivo do planejamento estratégico em uma organização?',
        A: 'Reduzir custos operacionais imediatos.',
        B: 'Definir a direção e os objetivos de longo prazo da empresa.',
        C: 'Contratar novos funcionários.',
        D: 'Aumentar as vendas no próximo mês.',
        E: 'Automatizar processos de TI.',
        RESPOSTA_CORRETA: '1',
        EXPLICACAO:
          'O planejamento estratégico visa definir o futuro da empresa, estabelecendo metas de longo prazo e os caminhos para alcançá-las.',
      },
      {
        CATEGORIA: 'Gestão Estratégica',
        TEMA: 'Fundamentos da Estratégia',
        ORDEM: 2,
        QUESTAO: "O que representa a 'Visão' de uma empresa?",
        A: 'O que a empresa faz hoje.',
        B: 'Os valores éticos dos fundadores.',
        C: 'Onde a empresa deseja chegar no futuro.',
        D: 'O plano de marketing atual.',
        E: 'O balanço financeiro anual.',
        RESPOSTA_CORRETA: '2',
        EXPLICACAO:
          'A Visão é a declaração de onde a empresa quer chegar em um horizonte de tempo definido.',
      },
      {
        CATEGORIA: 'Gestão Financeira',
        TEMA: 'Controle de Fluxo de Caixa',
        ORDEM: 1,
        QUESTAO: 'O que é o Fluxo de Caixa?',
        A: 'Apenas o dinheiro que entra na empresa.',
        B: 'O lucro líquido do ano.',
        C: 'O registro de todas as entradas e saídas de dinheiro.',
        D: 'O valor pago em impostos.',
        E: 'O fundo de reserva para emergências.',
        RESPOSTA_CORRETA: '2',
        EXPLICACAO:
          'O fluxo de caixa acompanha todas as movimentações financeiras, tanto de entrada quanto de saída de recursos.',
      },
      {
        CATEGORIA: 'Liderança',
        TEMA: 'Gestão de Equipes',
        ORDEM: 1,
        QUESTAO: 'Qual estilo de liderança envolve a equipe na tomada de decisão?',
        A: 'Autocrático',
        B: 'Laissez-faire',
        C: 'Democrático',
        D: 'Transacional',
        E: 'Burocrático',
        RESPOSTA_CORRETA: '2',
        EXPLICACAO:
          'A liderança democrática encoraja a participação da equipe, buscando opiniões antes de tomar uma decisão final.',
      },
      {
        CATEGORIA: 'Vendas',
        TEMA: 'Funil de Vendas',
        ORDEM: 1,
        QUESTAO: 'O que é o topo do funil de vendas?',
        A: 'O momento do fechamento da venda.',
        B: 'A etapa de atração e conscientização do cliente.',
        C: 'A negociação de preços.',
        D: 'O pós-venda.',
        E: 'A elaboração da proposta comercial.',
        RESPOSTA_CORRETA: '1',
        EXPLICACAO:
          'O topo do funil é onde os potenciais clientes têm o primeiro contato com a marca e identificam que possuem um problema ou necessidade.',
      },
    ]

    let trilha
    try {
      trilha = app.findFirstRecordByData('v1_protensora_trilhas', 'name', 'Gestão Protensora')
    } catch (_) {
      const colTrilhas = app.findCollectionByNameOrId('v1_protensora_trilhas')
      trilha = new Record(colTrilhas)
      trilha.set('name', 'Gestão Protensora')
      trilha.set('description', 'Trilha oficial com conteúdo de gestão estruturado.')
      trilha.set('active', true)
      app.save(trilha)
    }

    for (const item of seedData) {
      let modulo
      try {
        modulo = app.findFirstRecordByFilter(
          'v1_protensora_modulos',
          'name = {:name} && trilha_id = {:trilha_id}',
          { name: item.CATEGORIA, trilha_id: trilha.id },
        )
      } catch (_) {
        const colModulos = app.findCollectionByNameOrId('v1_protensora_modulos')
        modulo = new Record(colModulos)
        modulo.set('name', item.CATEGORIA)
        modulo.set('trilha_id', trilha.id)
        modulo.set('order', 1)
        app.save(modulo)
      }

      let unidade
      try {
        unidade = app.findFirstRecordByFilter(
          'v1_protensora_unidades',
          'titulo = {:titulo} && modulo_id = {:modulo_id}',
          { titulo: item.TEMA, modulo_id: modulo.id },
        )
      } catch (_) {
        const colUnidades = app.findCollectionByNameOrId('v1_protensora_unidades')
        unidade = new Record(colUnidades)
        unidade.set('titulo', item.TEMA)
        unidade.set('modulo_id', modulo.id)
        unidade.set('ordem', 1)
        app.save(unidade)
      }

      try {
        app.findFirstRecordByFilter(
          'v1_protensora_questoes',
          'text = {:text} && unidade_id = {:unidade_id}',
          { text: item.QUESTAO, unidade_id: unidade.id },
        )
      } catch (_) {
        const colQuestoes = app.findCollectionByNameOrId('v1_protensora_questoes')
        const questao = new Record(colQuestoes)
        questao.set('text', item.QUESTAO)
        questao.set('unidade_id', unidade.id)
        questao.set('modulo_id', modulo.id)
        questao.set('tipo', 'MULTIPLA_ESCOLHA')
        questao.set('type', 'multiple_choice')
        questao.set('order', item.ORDEM)
        questao.set('xp_acerto', 50)
        questao.set('resposta_correta', item.RESPOSTA_CORRETA)
        questao.set('explicacao', item.EXPLICACAO)

        const alternativas = [
          { id: '0', texto: item.A },
          { id: '1', texto: item.B },
          { id: '2', texto: item.C },
          { id: '3', texto: item.D },
          { id: '4', texto: item.E },
        ]
        questao.set('alternativas', alternativas)
        app.save(questao)
      }
    }
  },
  (app) => {
    // Up-only migration for seed data. Avoid deleting the structure because it could cascade delete user progress.
  },
)
