migrate(
  (app) => {
    const dealsCol = app.findCollectionByNameOrId('v1_deals')
    const collection = new Collection({
      name: 'v1_reunioes_comerciais',
      type: 'base',
      listRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      viewRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      createRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      updateRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      deleteRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      fields: [
        // Identificação (Etapa 1)
        { name: 'lead_nome', type: 'text', required: true },
        { name: 'empresa', type: 'text', required: true },
        { name: 'segmento', type: 'text', required: false },
        { name: 'colaboradores', type: 'number', required: false },
        { name: 'tempo_empresa', type: 'text', required: false },
        { name: 'canal_origem', type: 'text', required: false },
        { name: 'linha_interesse', type: 'text', required: false }, // neomaster | neoprime | indefinida
        { name: 'participantes', type: 'text', required: false },
        { name: 'decisor_presente', type: 'text', required: false }, // sim | nao

        // Qualificação (Etapa 2) - Chips
        { name: 'faturamento', type: 'text', required: false },
        { name: 'urgencia', type: 'text', required: false },
        { name: 'historico_consultoria', type: 'text', required: false },
        { name: 'capacidade_investimento', type: 'text', required: false },
        { name: 'prontidao_emocional', type: 'text', required: false },

        // Qualificação (Etapa 2) - Textos livres
        { name: 'dor_principal', type: 'text', required: false },
        { name: 'sono_futuro', type: 'text', required: false },
        { name: 'horas_operacao', type: 'text', required: false },
        { name: 'sair_15_dias', type: 'text', required: false },
        { name: 'saida_gestor', type: 'text', required: false },
        { name: 'custo_rotatividade', type: 'text', required: false },
        { name: 'cenario_12_meses', type: 'text', required: false },

        // Recomendação calculada (Etapa 3)
        { name: 'produto_recomendado', type: 'text', required: false },
        { name: 'valor_recomendado', type: 'number', required: false },
        { name: 'racional_motor', type: 'text', required: false },
        { name: 'dores_detectadas', type: 'json', required: false },
        { name: 'objecoes_sugeridas', type: 'json', required: false },

        // Anotações da conversa (Etapa 4)
        { name: 'compromissos', type: 'text', required: false },
        { name: 'numeros_citados', type: 'text', required: false },
        { name: 'termos_cliente', type: 'text', required: false },
        { name: 'indicacoes', type: 'text', required: false },
        { name: 'proximo_passo', type: 'text', required: false },
        { name: 'data_proximo_contato', type: 'text', required: false },

        // Fechamento (Etapa 5)
        { name: 'resultado', type: 'text', required: false }, // Fechou | Vai pensar | Objeção em aberto | Downsell aplicado | Não qualificado | Reagendado
        { name: 'condicao_escolhida', type: 'text', required: false },
        { name: 'forma_pagamento', type: 'text', required: false },
        { name: 'resumo_texto', type: 'text', required: false },

        // Integração Funil (v1_deals)
        {
          name: 'deal_id',
          type: 'relation',
          required: false,
          collectionId: dealsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },

        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_reunioes_lead_nome ON v1_reunioes_comerciais (lead_nome)',
        'CREATE INDEX idx_reunioes_empresa ON v1_reunioes_comerciais (empresa)',
        'CREATE INDEX idx_reunioes_resultado ON v1_reunioes_comerciais (resultado)',
        'CREATE INDEX idx_reunioes_created ON v1_reunioes_comerciais (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_reunioes_comerciais')
    app.delete(collection)
  },
)
