migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_assessment_questions',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'order', type: 'number', required: true },
        { name: 'pilar', type: 'text', required: true },
        { name: 'text_short', type: 'text', required: false },
        { name: 'text_full', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)

    const data = [
      {
        o: 1,
        p: 'Maturidade',
        ts: 'Tomada de decisão operacional sem o fundador',
        tf: 'Tomo decisões operacionais críticas sem consultar o fundador previamente.',
      },
      {
        o: 2,
        p: 'Maturidade',
        ts: 'Responsabilidade total por erros cometidos',
        tf: 'Sinto-me seguro para assumir a responsabilidade total pelos resultados de um erro cometido por mim.',
      },
      {
        o: 3,
        p: 'Maturidade',
        ts: 'Operação eficiente na ausência do fundador',
        tf: 'Consigo manter a operação funcionando com eficiência mesmo em ausências prolongadas do fundador.',
      },
      {
        o: 4,
        p: 'Maturidade',
        ts: 'Clareza sobre alçadas de decisão',
        tf: 'Tenho clareza sobre quais decisões posso tomar sozinho e quais exigem consenso familiar.',
      },
      {
        o: 5,
        p: 'Maturidade',
        ts: 'Rotina pautada por prioridades estratégicas',
        tf: 'Minha rotina é pautada por prioridades estratégicas e não apenas por demandas urgentes do dia a dia.',
      },

      {
        o: 6,
        p: 'Competências',
        ts: 'Consciência de lacunas técnicas no negócio',
        tf: 'Tenho plena consciência das áreas do negócio onde meu conhecimento ainda é superficial.',
      },
      {
        o: 7,
        p: 'Competências',
        ts: 'Busca ativa por apoio de especialistas',
        tf: 'Busco ativamente especialistas para me apoiar em temas que não domino tecnicamente.',
      },
      {
        o: 8,
        p: 'Competências',
        ts: 'Explicação da geração de valor por setor',
        tf: 'Consigo explicar detalhadamente como cada setor da fazenda/empresa gera valor para o todo.',
      },
      {
        o: 9,
        p: 'Competências',
        ts: 'Identificação de competências a desenvolver',
        tf: 'Identifico com facilidade quais competências preciso desenvolver nos próximos 12 meses.',
      },
      {
        o: 10,
        p: 'Competências',
        ts: 'Conforto em admitir falta de respostas',
        tf: 'Sinto-me confortável em admitir para a equipe quando não possuo a resposta para um problema.',
      },

      {
        o: 11,
        p: 'Inteligência Emocional',
        ts: 'Calma e foco em soluções durante crises',
        tf: 'Mantenho a calma e o foco na solução mesmo diante de crises severas (quebra de safra, queda de preços).',
      },
      {
        o: 12,
        p: 'Inteligência Emocional',
        ts: 'Recepção construtiva de críticas do fundador',
        tf: 'Recebo críticas do fundador sobre meu desempenho sem me sentir pessoalmente atacado.',
      },
      {
        o: 13,
        p: 'Inteligência Emocional',
        ts: 'Separação entre trabalho e vida familiar',
        tf: 'Consigo separar as frustrações do ambiente de trabalho das relações familiares no final do dia.',
      },
      {
        o: 14,
        p: 'Inteligência Emocional',
        ts: 'Paciência com o tempo de maturação de mudanças',
        tf: 'Tenho paciência para respeitar o tempo de maturação dos processos de mudança que proponho.',
      },
      {
        o: 15,
        p: 'Inteligência Emocional',
        ts: 'Autoconfiança independente de validação externa',
        tf: 'Minha autoconfiança não depende exclusivamente do elogio ou validação do fundador.',
      },

      {
        o: 16,
        p: 'Visão Estratégica',
        ts: 'Estudo semanal de tendências de mercado',
        tf: 'Dedico tempo semanal para estudar tendências de mercado que podem impactar o negócio no futuro.',
      },
      {
        o: 17,
        p: 'Visão Estratégica',
        ts: 'Inovação com respeito ao legado familiar',
        tf: 'Proponho inovações que respeitam o legado e a história construída pelo fundador.',
      },
      {
        o: 18,
        p: 'Visão Estratégica',
        ts: 'Projeção clara da empresa para 5 anos',
        tf: 'Consigo projetar o cenário da empresa para os próximos 5 anos com clareza de metas.',
      },
      {
        o: 19,
        p: 'Visão Estratégica',
        ts: 'Entendimento de tecnologia e margem de lucro',
        tf: 'Entendo como as mudanças tecnológicas no agro podem aumentar nossa margem de lucro.',
      },
      {
        o: 20,
        p: 'Visão Estratégica',
        ts: 'Questionamento de processos obsoletos',
        tf: 'Questiono processos antigos quando percebo que eles não atendem mais às necessidades atuais.',
      },

      {
        o: 21,
        p: 'Liderança',
        ts: 'Procura espontânea da equipe por orientação',
        tf: 'A equipe me procura para orientações técnicas e estratégicas de forma espontânea.',
      },
      {
        o: 22,
        p: 'Liderança',
        ts: 'Facilidade em delegar tarefas complexas',
        tf: 'Tenho facilidade em delegar tarefas complexas sem precisar monitorar cada passo da execução.',
      },
      {
        o: 23,
        p: 'Liderança',
        ts: 'Aplicação de feedbacks corretivos construtivos',
        tf: 'Consigo dar feedbacks corretivos de forma construtiva para colaboradores mais antigos que eu.',
      },
      {
        o: 24,
        p: 'Liderança',
        ts: 'Investimento no desenvolvimento do time',
        tf: 'Invisto tempo no desenvolvimento e treinamento das pessoas que trabalham comigo.',
      },
      {
        o: 25,
        p: 'Liderança',
        ts: 'Autoridade moral perante os colaboradores',
        tf: 'Sinto que possuo autoridade moral perante o time, independentemente do meu sobrenome.',
      },

      {
        o: 26,
        p: 'Integridade',
        ts: 'Ações como exemplo dos valores éticos',
        tf: 'Minhas ações diárias são o maior exemplo dos valores éticos defendidos pela nossa família.',
      },
      {
        o: 27,
        p: 'Integridade',
        ts: 'Renúncia ao lucro que fere princípios',
        tf: 'Sou capaz de abrir mão de um lucro imediato se isso ferir os princípios da empresa.',
      },
      {
        o: 28,
        p: 'Integridade',
        ts: 'Cumprimento rigoroso de prazos e acordos',
        tf: 'Cumpro rigorosamente os combinados e prazos estabelecidos com parceiros e fornecedores.',
      },
      {
        o: 29,
        p: 'Integridade',
        ts: 'Equidade entre familiares e externos',
        tf: 'Demonstro o mesmo nível de respeito e exigência com familiares e com colaboradores externos.',
      },
      {
        o: 30,
        p: 'Integridade',
        ts: 'Proteção da reputação da família',
        tf: 'Sinto orgulho da reputação que nossa família construiu no mercado e trabalho para protegê-la.',
      },

      {
        o: 31,
        p: 'Comunicação',
        ts: 'Enfrentamento imediato de conflitos',
        tf: 'Enfrento conflitos familiares ou profissionais assim que eles surgem, sem adiá-los.',
      },
      {
        o: 32,
        p: 'Comunicação',
        ts: 'Capacidade de dizer não de forma respeitosa',
        tf: 'Consigo dizer "não" ao fundador de forma respeitosa quando discordo de uma estratégia.',
      },
      {
        o: 33,
        p: 'Comunicação',
        ts: 'Estruturação de conversas sobre temas sensíveis',
        tf: 'Estruturo conversas sobre temas sensíveis (dinheiro, herança, desempenho) com clareza e calma.',
      },
      {
        o: 34,
        p: 'Comunicação',
        ts: 'Escuta ativa de opiniões divergentes',
        tf: 'Escuto atentamente opiniões divergentes antes de tentar impor meu ponto de vista.',
      },
      {
        o: 35,
        p: 'Comunicação',
        ts: 'Preparo para mediação de conflitos familiares',
        tf: 'Sinto-me preparado para mediar desentendimentos entre outros membros da família no negócio.',
      },

      {
        o: 36,
        p: 'Adaptabilidade',
        ts: 'Mudança de opinião baseada em dados',
        tf: 'Mudo de opinião rapidamente quando recebo dados que provam que eu estava errado.',
      },
      {
        o: 37,
        p: 'Adaptabilidade',
        ts: 'Hábito de aprendizado contínuo e gestão',
        tf: 'Tenho o hábito de ler livros, fazer cursos ou participar de grupos de discussão sobre gestão.',
      },
      {
        o: 38,
        p: 'Adaptabilidade',
        ts: 'Adaptação do estilo de liderança',
        tf: 'Adapto meu estilo de liderança conforme o perfil da pessoa com quem estou interagindo.',
      },
      {
        o: 39,
        p: 'Adaptabilidade',
        ts: 'Erro visto como oportunidade de aprendizado',
        tf: 'Vejo os erros como oportunidades de aprendizado e não apenas como falhas a serem punidas.',
      },
      {
        o: 40,
        p: 'Adaptabilidade',
        ts: 'Disposição para desaprender métodos antigos',
        tf: 'Estou disposto a desaprender métodos antigos para adotar práticas mais eficientes.',
      },

      {
        o: 41,
        p: 'Relacionamento Familiar',
        ts: 'Respeito à hierarquia atual do fundador',
        tf: 'Respeito a hierarquia do fundador enquanto ele estiver no comando da operação.',
      },
      {
        o: 42,
        p: 'Relacionamento Familiar',
        ts: 'Preservação dos momentos de lazer familiar',
        tf: 'Evito levar discussões de trabalho para a mesa de jantar ou momentos de lazer da família.',
      },
      {
        o: 43,
        p: 'Relacionamento Familiar',
        ts: 'Transparência com os demais herdeiros',
        tf: 'Trato os interesses dos outros herdeiros com equidade e transparência.',
      },
      {
        o: 44,
        p: 'Relacionamento Familiar',
        ts: 'Compreensão das motivações do fundador',
        tf: 'Compreendo as motivações emocionais que levam o fundador a agir de determinada forma.',
      },
      {
        o: 45,
        p: 'Relacionamento Familiar',
        ts: 'Promoção de harmonia e cooperação',
        tf: 'Contribuo ativamente para que o ambiente familiar seja de harmonia e cooperação.',
      },

      {
        o: 46,
        p: 'Mapeamento Agro',
        ts: 'Domínio técnico da produção',
        tf: 'Domino os ciclos técnicos, manejo e produtividade da nossa atividade principal.',
      },
      {
        o: 47,
        p: 'Mapeamento Agro',
        ts: 'Domínio de comercialização e mercado',
        tf: 'Entendo de mercado futuro, fixação de preços e estratégias de venda.',
      },
      {
        o: 48,
        p: 'Mapeamento Agro',
        ts: 'Domínio de gestão de pessoas',
        tf: 'Sei contratar, motivar e gerir o quadro de funcionários da fazenda.',
      },
      {
        o: 49,
        p: 'Mapeamento Agro',
        ts: 'Domínio de finanças e investimentos',
        tf: 'Compreendo fluxo de caixa, balanço patrimonial e gestão de investimentos.',
      },
      {
        o: 50,
        p: 'Mapeamento Agro',
        ts: 'Domínio de sustentabilidade e normas',
        tf: 'Conheço as normas ambientais e práticas de conformidade do setor.',
      },
      {
        o: 51,
        p: 'Mapeamento Agro',
        ts: 'Domínio de inovação e AgTechs',
        tf: 'Sei identificar e implementar tecnologias que aumentam a eficiência no campo.',
      },
    ]

    data.forEach((q) => {
      const record = new Record(collection)
      record.set('order', q.o)
      record.set('pilar', q.p)
      record.set('text_short', q.ts)
      record.set('text_full', q.tf)
      app.save(record)
    })
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_assessment_questions')
    app.delete(collection)
  },
)
