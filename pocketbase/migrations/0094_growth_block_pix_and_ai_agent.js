migrate(
  (app) => {
    // 1. Adicionar campos de PIX em v1_saas_settings
    const saasSettingsCol = app.findCollectionByNameOrId('v1_saas_settings')

    if (!saasSettingsCol.fields.getByName('pix_key')) {
      saasSettingsCol.fields.add(new TextField({ name: 'pix_key' }))
    }
    if (!saasSettingsCol.fields.getByName('pix_key_type')) {
      saasSettingsCol.fields.add(
        new SelectField({
          name: 'pix_key_type',
          values: ['cnpj', 'cpf', 'email', 'telefone', 'aleatoria'],
          maxSelect: 1,
        }),
      )
    }
    if (!saasSettingsCol.fields.getByName('pix_beneficiary_name')) {
      saasSettingsCol.fields.add(new TextField({ name: 'pix_beneficiary_name' }))
    }
    if (!saasSettingsCol.fields.getByName('pix_beneficiary_city')) {
      saasSettingsCol.fields.add(new TextField({ name: 'pix_beneficiary_city' }))
    }
    app.save(saasSettingsCol)

    // 2. Adicionar payment_method e comprovante_info em v1_saas_credit_purchases se necessário
    const purchasesCol = app.findCollectionByNameOrId('v1_saas_credit_purchases')
    if (!purchasesCol.fields.getByName('payment_method')) {
      purchasesCol.fields.add(
        new SelectField({
          name: 'payment_method',
          values: ['pix', 'mercadopago', 'bonus', 'manual'],
          maxSelect: 1,
        }),
      )
    }
    if (!purchasesCol.fields.getByName('payment_proof')) {
      purchasesCol.fields.add(new TextField({ name: 'payment_proof' }))
    }
    app.save(purchasesCol)

    // 3. Declarar Agente IA de Acompanhamento de Mentorandos ($ai.agents.define)
    // Coleções acessíveis: v1_mentees, v1_sessoes, v1_agendamentos
    // O agente utiliza perms de leitura para analisar evolução, pautas e metas
    $ai.agents.define(app, {
      slug: 'mentor-advisor',
      name: 'Mentor Advisor IA',
      description:
        'Acompanha o mentorando, resume evolução, detecta desvios de meta e sugere pautas para a próxima sessão de mentoria.',
      systemPrompt: `Você é o Mentor Advisor IA do Sistema Grupo Flávio Moura (SGFM).
Seu objetivo é ser o assistente estratégico de mentoria do mentorando conectado.
Com base nas sessões registradas, tarefas, anotações de evolução e compromissos:
1. Resuma a trajetória e marcos alcançados até o momento.
2. Identifique eventuais desvios de metas, prazos ou tarefas pendentes antes da próxima sessão.
3. Sugira uma pauta estruturada de 3 a 5 tópicos prioritários para a próxima reunião de mentoria com Flávio Moura.
4. Mantenha um tom profissional, encorajador, consultivo e focado em alta performance.
Nunca invente dados que não estejam nas sessões ou no cadastro do mentorando. Sempre que citar uma sessão ou tarefa, mencione a data ou contexto.`,
      tier: 'fast',
      tools: [
        {
          collection: 'v1_mentees',
          perms: { list: true, read: true },
          actAs: 'user',
        },
        {
          collection: 'v1_sessoes',
          perms: { list: true, read: true },
          actAs: 'user',
        },
        {
          collection: 'v1_agendamentos',
          perms: { list: true, read: true },
          actAs: 'user',
        },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Metodologia Flávio Moura: Foco em gestão financeira, clareza de indicadores, alinhamento de liderança, plano de ação quinzenal e acompanhamento contínuo de metas.',
          },
        },
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Como estruturar uma sessão de mentoria?',
                answer:
                  'A sessão é dividida em: 1) Revisão das tarefas do ciclo anterior, 2) Análise de indicadores críticos, 3) Discussão do tema central e gargalos, 4) Definição do novo plano de ação.',
              },
              {
                question: 'O que fazer quando há desvio de meta?',
                answer:
                  'Mapear a causa raiz operacional, ajustar os prazos prioritários e acordar novo compromisso no plano de ação da mentoria.',
              },
            ],
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'mentor-advisor')
    } catch (_) {}

    const saasSettingsCol = app.findCollectionByNameOrId('v1_saas_settings')
    if (saasSettingsCol.fields.getByName('pix_key')) saasSettingsCol.fields.removeByName('pix_key')
    if (saasSettingsCol.fields.getByName('pix_key_type'))
      saasSettingsCol.fields.removeByName('pix_key_type')
    if (saasSettingsCol.fields.getByName('pix_beneficiary_name'))
      saasSettingsCol.fields.removeByName('pix_beneficiary_name')
    if (saasSettingsCol.fields.getByName('pix_beneficiary_city'))
      saasSettingsCol.fields.removeByName('pix_beneficiary_city')
    app.save(saasSettingsCol)

    const purchasesCol = app.findCollectionByNameOrId('v1_saas_credit_purchases')
    if (purchasesCol.fields.getByName('payment_method'))
      purchasesCol.fields.removeByName('payment_method')
    if (purchasesCol.fields.getByName('payment_proof'))
      purchasesCol.fields.removeByName('payment_proof')
    app.save(purchasesCol)
  },
)
