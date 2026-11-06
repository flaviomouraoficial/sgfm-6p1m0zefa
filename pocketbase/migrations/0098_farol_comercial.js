// Farol Comercial: Proposta, Precificação e Faturamento por Projeto.
// Peça 1 (custo padronizado), Peça 2 (motor de precificação), Peça 3 (proposta vinculada)
// e Peça 4 (faturamento e apuração). Idempotente: no-op em banco vazio ou já migrado.
// Sem backfill destrutivo: campos existentes de propostas não são sobrescritos.
migrate(
  (app) => {
    const ADMIN_RULE =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || @request.auth.email = 'admin@grupoflaviomoura.com.br'"
    const RULES = {
      listRule: ADMIN_RULE,
      viewRule: ADMIN_RULE,
      createRule: ADMIN_RULE,
      updateRule: ADMIN_RULE,
      deleteRule: ADMIN_RULE,
    }

    const empresasCol = app.findCollectionByNameOrId('v1_empresas')
    const clientesCol = app.findCollectionByNameOrId('v1_clientes')
    const profCol = app.findCollectionByNameOrId('v1_profissionais')

    // ========================================================================
    // PEÇA 1 — Estrutura de custo padronizada
    // ========================================================================

    // Custo de hora por tipo de trabalho (entrega, preparação, deslocamento, relatoria/devolutiva)
    try {
      app.findCollectionByNameOrId('v1_recursos_custo')
    } catch (_) {
      app.save(
        new Collection({
          name: 'v1_recursos_custo',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'profissional_id', type: 'relation', collectionId: profCol.id, maxSelect: 1 },
            { name: 'profissional_nome', type: 'text', max: 200 },
            {
              name: 'tipo_hora',
              type: 'select',
              values: ['entrega', 'preparacao', 'deslocamento', 'relatoria'],
            },
            { name: 'custo_hora', type: 'number' },
            { name: 'ativo', type: 'bool' },
            { name: 'observacoes', type: 'text', max: 1000 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_recursos_tipo ON v1_recursos_custo (tipo_hora)'],
        }),
      )
    }

    // Catálogo de componentes de custo (logística, material, plataforma...)
    try {
      app.findCollectionByNameOrId('v1_componentes_custo')
    } catch (_) {
      app.save(
        new Collection({
          name: 'v1_componentes_custo',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'nome', type: 'text', required: true, max: 200 },
            { name: 'categoria', type: 'text', max: 100 },
            { name: 'unidade', type: 'text', max: 50 }, // participante | diária | evento | unidade
            { name: 'valor_padrao', type: 'number' },
            { name: 'reembolsavel', type: 'bool' }, // viagem repassada ao cliente
            { name: 'ativo', type: 'bool' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE UNIQUE INDEX idx_componentes_nome ON v1_componentes_custo (nome)'],
        }),
      )
    }

    // Overhead e impostos POR EMPRESA (defaults revisáveis, nunca hardcoded no código)
    try {
      app.findCollectionByNameOrId('v1_overhead_config')
    } catch (_) {
      app.save(
        new Collection({
          name: 'v1_overhead_config',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'empresa_id', type: 'relation', collectionId: empresasCol.id, maxSelect: 1 },
            { name: 'pct_administrativo', type: 'number' }, // default 10
            { name: 'pct_financeiro', type: 'number' }, // default 8
            { name: 'pct_comercial', type: 'number' }, // default 7
            { name: 'pct_imposto', type: 'number' }, // default 8 (Simples Nacional)
            { name: 'fator_preparacao', type: 'number' }, // default 2.0 (faixa documentada 1.5-2.0)
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_overhead_empresa ON v1_overhead_config (empresa_id)'],
        }),
      )
    }

    // Seed de overhead padrão por empresa existente (não sobrescreve config existente)
    try {
      const overCol = app.findCollectionByNameOrId('v1_overhead_config')
      const empresas = app.findRecordsByFilter('v1_empresas', '', '-is_principal', 0, 0)
      for (const emp of empresas) {
        const existentes = app.findRecordsByFilter(
          'v1_overhead_config',
          'empresa_id = {:emp}',
          '',
          1,
          0,
          { emp: emp.id },
        )
        if (existentes.length === 0) {
          const rec = new Record(overCol)
          rec.set('empresa_id', emp.id)
          rec.set('pct_administrativo', 10)
          rec.set('pct_financeiro', 8)
          rec.set('pct_comercial', 7)
          rec.set('pct_imposto', 8)
          rec.set('fator_preparacao', 2.0)
          app.save(rec)
        }
      }
    } catch (err) {
      console.log('farol: seed overhead ignorado: ' + err)
    }

    // ========================================================================
    // PEÇA 2 — Motor de precificação
    // ========================================================================

    // Modelos de cobrança configuráveis como registros (não enum fixo)
    try {
      app.findCollectionByNameOrId('v1_modelos_cobranca')
    } catch (_) {
      app.save(
        new Collection({
          name: 'v1_modelos_cobranca',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'nome', type: 'text', required: true, max: 200 },
            { name: 'descricao', type: 'text', max: 1000 },
            { name: 'ativo', type: 'bool' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE UNIQUE INDEX idx_modelos_nome ON v1_modelos_cobranca (nome)'],
        }),
      )
    }

    // Seed dos modelos padrão (idempotente)
    try {
      const modelosSeed = [
        'Projeto Fechado',
        'Por Entregável',
        'Por Dia de Entrega',
        'Por Participante',
        'Por Turma',
        'Retainer Mensal',
        'Retainer + Êxito',
      ]
      const modCol = app.findCollectionByNameOrId('v1_modelos_cobranca')
      for (const nome of modelosSeed) {
        const existe = app.findRecordsByFilter('v1_modelos_cobranca', 'nome = {:n}', '', 1, 0, {
          n: nome,
        })
        if (existe.length === 0) {
          const rec = new Record(modCol)
          rec.set('nome', nome)
          rec.set('ativo', true)
          app.save(rec)
        }
      }
    } catch (err) {
      console.log('farol: seed modelos ignorado: ' + err)
    }

    // Escopo em módulos precificáveis (habilita venda parcial e aditivo)
    try {
      app.findCollectionByNameOrId('v1_escopo_modulos')
    } catch (_) {
      app.save(
        new Collection({
          name: 'v1_escopo_modulos',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'nome', type: 'text', required: true, max: 200 },
            { name: 'descricao', type: 'text', max: 1000 },
            { name: 'custo_padrao', type: 'number' },
            { name: 'preco_padrao', type: 'number' },
            { name: 'ativo', type: 'bool' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE UNIQUE INDEX idx_escopo_nome ON v1_escopo_modulos (nome)'],
        }),
      )
    }

    try {
      const modulosSeed = ['Diagnóstico', 'Desenho', 'Entrega', 'Avaliação de Impacto']
      const escCol = app.findCollectionByNameOrId('v1_escopo_modulos')
      for (const nome of modulosSeed) {
        const existe = app.findRecordsByFilter('v1_escopo_modulos', 'nome = {:n}', '', 1, 0, {
          n: nome,
        })
        if (existe.length === 0) {
          const rec = new Record(escCol)
          rec.set('nome', nome)
          rec.set('ativo', true)
          app.save(rec)
        }
      }
    } catch (err) {
      console.log('farol: seed módulos ignorado: ' + err)
    }

    // Orçamento (cabeçalho) + versões com rastro de negociação
    try {
      app.findCollectionByNameOrId('v1_orcamentos')
    } catch (_) {
      const modColId = app.findCollectionByNameOrId('v1_modelos_cobranca').id
      app.save(
        new Collection({
          name: 'v1_orcamentos',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'titulo', type: 'text', max: 300 },
            { name: 'cliente_id', type: 'relation', collectionId: clientesCol.id, maxSelect: 1 },
            { name: 'empresa_id', type: 'relation', collectionId: empresasCol.id, maxSelect: 1 },
            { name: 'modelo_id', type: 'relation', collectionId: modColId, maxSelect: 1 },
            { name: 'escopo_json', type: 'json' }, // dias, participantes, módulos, componentes
            { name: 'status', type: 'text', max: 50 }, // aberto | aprovado | arquivado
            { name: 'versao_aprovada_id', type: 'text', max: 50 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_orcamentos_cliente ON v1_orcamentos (cliente_id)'],
        }),
      )
    }

    try {
      app.findCollectionByNameOrId('v1_orcamento_versoes')
    } catch (_) {
      const orcColId = app.findCollectionByNameOrId('v1_orcamentos').id
      app.save(
        new Collection({
          name: 'v1_orcamento_versoes',
          type: 'base',
          ...RULES,
          fields: [
            {
              name: 'orcamento_id',
              type: 'relation',
              collectionId: orcColId,
              maxSelect: 1,
              required: true,
            },
            { name: 'versao', type: 'number', required: true },
            { name: 'dados_json', type: 'json' }, // snapshot completo do cálculo
            { name: 'custo_total', type: 'number' },
            { name: 'preco_minimo', type: 'number' },
            { name: 'preco_sugerido', type: 'number' },
            { name: 'preco_final', type: 'number' }, // preço praticado (com desconto)
            { name: 'desconto_pct', type: 'number' },
            { name: 'margem_alvo', type: 'number' },
            { name: 'margem_real_pct', type: 'number' },
            { name: 'margem_variacao', type: 'number' }, // variação de margem vs versão anterior
            { name: 'autor_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
            { name: 'autor_nome', type: 'text', max: 200 },
            { name: 'status', type: 'text', max: 50 }, // rascunho | aprovada
            { name: 'observacoes', type: 'text', max: 2000 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_orcversoes_orcamento ON v1_orcamento_versoes (orcamento_id)'],
        }),
      )
    }

    // Alçadas de desconto por perfil (reusa v1_access_profiles)
    try {
      app.findCollectionByNameOrId('v1_alcadas_desconto')
    } catch (_) {
      const perfColId = app.findCollectionByNameOrId('v1_access_profiles').id
      app.save(
        new Collection({
          name: 'v1_alcadas_desconto',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'perfil_id', type: 'relation', collectionId: perfColId, maxSelect: 1 },
            { name: 'perfil_nome', type: 'text', max: 200 },
            { name: 'pct_max', type: 'number' }, // desconto máximo em %
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }

    // ========================================================================
    // PEÇA 3 — Proposta vinculada (adaptar v1_proposals, NÃO recriar)
    // ========================================================================
    try {
      const propCol = app.findCollectionByNameOrId('v1_proposals')
      const versoesColId = app.findCollectionByNameOrId('v1_orcamento_versoes').id
      const novosCampos = [
        { name: 'orcamento_versao_id', kind: 'relation', ref: versoesColId },
        { name: 'versao', kind: 'number' },
        { name: 'aprovacao_interna', kind: 'json' }, // {autor, data, motivo, desconto_pct, limite_pct}
        { name: 'motivo_perda', kind: 'text' },
        { name: 'enviada_em', kind: 'date' },
        { name: 'validade_dias', kind: 'number' },
        { name: 'forma_pagamento', kind: 'text' },
        { name: 'reajuste', kind: 'text' },
        { name: 'clausula_cancelamento', kind: 'text' },
        { name: 'propriedade_material', kind: 'text' },
        { name: 'condicoes_texto_original', kind: 'text' },
      ]
      let mudou = false
      for (const c of novosCampos) {
        if (propCol.fields.getByName(c.name)) continue
        if (c.kind === 'relation') {
          propCol.fields.add(
            new RelationField({
              name: c.name,
              collectionId: c.ref,
              maxSelect: 1,
              cascadeDelete: false,
            }),
          )
        } else if (c.kind === 'number') {
          propCol.fields.add(new NumberField({ name: c.name }))
        } else if (c.kind === 'date') {
          propCol.fields.add(new DateField({ name: c.name }))
        } else if (c.kind === 'json') {
          propCol.fields.add(new JSONField({ name: c.name }))
        } else {
          propCol.fields.add(new TextField({ name: c.name, max: 2000 }))
        }
        mudou = true
      }
      if (mudou) app.save(propCol)

      // Backfill não-destrutivo: parseia condicoes_comerciais JSON existente para os
      // campos estruturados, preservando o texto original. Só preenche campos vazios.
      const propostas = app.findRecordsByFilter('v1_proposals', '', '', 0, 0)
      for (const p of propostas) {
        const raw = p.getString('condicoes_comerciais') || ''
        if (raw === '') continue
        let obj = null
        try {
          obj = JSON.parse(raw)
        } catch (_) {
          continue
        }
        if (!obj || typeof obj !== 'object') continue
        let alterou = false
        const map = [
          ['validade_dias', 'validade_dias'],
          ['forma_pagamento', 'forma_pagamento'],
          ['reajuste', 'reajuste'],
          ['clausula_cancelamento', 'clausula_cancelamento'],
          ['propriedade_material', 'propriedade_material'],
        ]
        for (const [jsonKey, campo] of map) {
          if (p.getString(campo) === '' && obj[jsonKey] !== undefined && obj[jsonKey] !== null) {
            p.set(campo, String(obj[jsonKey]))
            alterou = true
          }
        }
        if (p.getString('condicoes_texto_original') === '') {
          p.set('condicoes_texto_original', raw)
          alterou = true
        }
        if (alterou) app.save(p)
      }
    } catch (err) {
      console.log('farol: campos de v1_proposals: ' + err)
    }

    // Rastro das rodadas de negociação da proposta
    try {
      app.findCollectionByNameOrId('v1_proposal_versoes')
    } catch (_) {
      const propColId = app.findCollectionByNameOrId('v1_proposals').id
      app.save(
        new Collection({
          name: 'v1_proposal_versoes',
          type: 'base',
          ...RULES,
          fields: [
            {
              name: 'proposal_id',
              type: 'relation',
              collectionId: propColId,
              maxSelect: 1,
              required: true,
            },
            { name: 'versao', type: 'number' },
            { name: 'valor', type: 'number' },
            { name: 'dados_json', type: 'json' },
            { name: 'autor_nome', type: 'text', max: 200 },
            { name: 'observacoes', type: 'text', max: 2000 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_propversoes_proposta ON v1_proposal_versoes (proposal_id)'],
        }),
      )
    }

    // ========================================================================
    // PEÇA 4 — Faturamento e apuração
    // ========================================================================

    // Contrato de treinamento como raiz do projeto: custo/apontamentos/faturamento
    // penduram no contrato — sem entidade de projeto duplicada.
    let contratosColId = ''
    try {
      contratosColId = app.findCollectionByNameOrId('v1_contratos_treinamento').id
    } catch (_) {}

    try {
      app.findCollectionByNameOrId('v1_planos_faturamento')
    } catch (_) {
      const propColId = app.findCollectionByNameOrId('v1_proposals').id
      app.save(
        new Collection({
          name: 'v1_planos_faturamento',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'titulo', type: 'text', max: 300 },
            { name: 'proposal_id', type: 'relation', collectionId: propColId, maxSelect: 1 },
            { name: 'orcamento_versao_id', type: 'text', max: 50 },
            {
              name: 'contrato_id',
              type: 'relation',
              collectionId: contratosColId || '_self_',
              maxSelect: 1,
            },
            { name: 'cliente_id', type: 'relation', collectionId: clientesCol.id, maxSelect: 1 },
            { name: 'empresa_id', type: 'relation', collectionId: empresasCol.id, maxSelect: 1 },
            {
              name: 'conta_id',
              type: 'relation',
              collectionId: app.findCollectionByNameOrId('v1_contas_financeiras').id,
              maxSelect: 1,
            },
            { name: 'valor_total', type: 'number' },
            { name: 'status', type: 'text', max: 50 }, // ativo | concluido | cancelado
            { name: 'observacoes', type: 'text', max: 2000 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_planos_proposta ON v1_planos_faturamento (proposal_id)'],
        }),
      )
    }

    try {
      app.findCollectionByNameOrId('v1_parcelas_faturamento')
    } catch (_) {
      const planoColId = app.findCollectionByNameOrId('v1_planos_faturamento').id
      app.save(
        new Collection({
          name: 'v1_parcelas_faturamento',
          type: 'base',
          ...RULES,
          fields: [
            {
              name: 'plano_id',
              type: 'relation',
              collectionId: planoColId,
              maxSelect: 1,
              required: true,
            },
            { name: 'numero', type: 'number' },
            { name: 'descricao', type: 'text', max: 500 }, // marco / entrega / medição / recorrência
            { name: 'valor', type: 'number', required: true },
            { name: 'data_prevista', type: 'date' },
            { name: 'status', type: 'text', max: 50 }, // prevista | faturada | paga | cancelada
            { name: 'nota_fiscal', type: 'text', max: 100 },
            { name: 'retencao', type: 'number' },
            { name: 'origem', type: 'text', max: 50 }, // original | aditivo
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: ['CREATE INDEX idx_parcelas_plano ON v1_parcelas_faturamento (plano_id)'],
        }),
      )
    }

    // Apontamentos de horas: alimenta o custo real
    try {
      app.findCollectionByNameOrId('v1_apontamentos')
    } catch (_) {
      app.save(
        new Collection({
          name: 'v1_apontamentos',
          type: 'base',
          ...RULES,
          fields: [
            { name: 'data', type: 'date', required: true },
            {
              name: 'contrato_id',
              type: 'relation',
              collectionId: contratosColId || '_self_',
              maxSelect: 1,
            },
            { name: 'projeto_ref', type: 'text', max: 300 }, // fallback textual do projeto
            { name: 'empresa_id', type: 'relation', collectionId: empresasCol.id, maxSelect: 1 },
            { name: 'recurso_id', type: 'relation', collectionId: profCol.id, maxSelect: 1 },
            { name: 'recurso_nome', type: 'text', max: 200 },
            {
              name: 'tipo_hora',
              type: 'select',
              values: ['entrega', 'preparacao', 'deslocamento', 'relatoria'],
            },
            { name: 'horas', type: 'number' },
            { name: 'faturavel', type: 'bool' },
            { name: 'observacoes', type: 'text', max: 1000 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE INDEX idx_apontamentos_contrato ON v1_apontamentos (contrato_id)',
            'CREATE INDEX idx_apontamentos_data ON v1_apontamentos (data)',
          ],
        }),
      )
    }

    app.logger().info('farol_comercial: migração aplicada')
  },
  (app) => {
    // Rollback: remove apenas o que esta migração criou. Campos de v1_proposals
    // são mantidos no rollback para não perder dados de propostas já vinculadas.
    const nomes = [
      'v1_apontamentos',
      'v1_parcelas_faturamento',
      'v1_planos_faturamento',
      'v1_proposal_versoes',
      'v1_alcadas_desconto',
      'v1_orcamento_versoes',
      'v1_orcamentos',
      'v1_escopo_modulos',
      'v1_modelos_cobranca',
      'v1_overhead_config',
      'v1_componentes_custo',
      'v1_recursos_custo',
    ]
    for (const n of nomes) {
      try {
        app.delete(app.findCollectionByNameOrId(n))
      } catch (_) {}
    }
  },
)
