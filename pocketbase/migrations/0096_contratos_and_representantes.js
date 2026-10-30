migrate(
  (app) => {
    // =========================================================================
    // 1. Ampliar campos de endereço e notificações em v1_empresas e v1_clientes
    // =========================================================================
    try {
      const empCol = app.findCollectionByNameOrId('v1_empresas')
      const fieldsToAddEmp = [
        { name: 'logradouro', type: 'text' },
        { name: 'numero', type: 'text' },
        { name: 'complemento', type: 'text' },
        { name: 'bairro', type: 'text' },
        { name: 'email_notificacoes', type: 'email' },
      ]
      for (const f of fieldsToAddEmp) {
        if (!empCol.fields.getByName(f.name)) {
          if (f.type === 'email') {
            empCol.fields.add(new EmailField({ name: f.name }))
          } else {
            empCol.fields.add(new TextField({ name: f.name }))
          }
        }
      }
      app.save(empCol)
    } catch (err) {
      console.log('Erro ao atualizar campos de v1_empresas: ' + err)
    }

    try {
      const cliCol = app.findCollectionByNameOrId('v1_clientes')
      const fieldsToAddCli = [
        { name: 'razao_social', type: 'text' },
        { name: 'logradouro', type: 'text' },
        { name: 'numero', type: 'text' },
        { name: 'complemento', type: 'text' },
        { name: 'bairro', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'cep', type: 'text' },
        { name: 'email_notificacoes', type: 'email' },
      ]
      for (const f of fieldsToAddCli) {
        if (!cliCol.fields.getByName(f.name)) {
          if (f.type === 'email') {
            cliCol.fields.add(new EmailField({ name: f.name }))
          } else {
            cliCol.fields.add(new TextField({ name: f.name }))
          }
        }
      }
      app.save(cliCol)
    } catch (err) {
      console.log('Erro ao atualizar campos de v1_clientes: ' + err)
    }

    // =========================================================================
    // 2. Criar coleção v1_representantes_legais
    // =========================================================================
    let repCol
    try {
      repCol = app.findCollectionByNameOrId('v1_representantes_legais')
    } catch (_) {
      const empresasCol = app.findCollectionByNameOrId('v1_empresas')
      const clientesCol = app.findCollectionByNameOrId('v1_clientes')

      repCol = new Collection({
        name: 'v1_representantes_legais',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'nome_completo', type: 'text', required: true },
          { name: 'nacionalidade', type: 'text', required: true },
          { name: 'estado_civil', type: 'text', required: true },
          { name: 'profissao', type: 'text', required: true },
          { name: 'rg', type: 'text', required: true },
          { name: 'cpf', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'telefone', type: 'text', required: true },
          { name: 'is_principal', type: 'bool' },
          { name: 'ativo', type: 'bool' },
          {
            name: 'empresa_id',
            type: 'relation',
            collectionId: empresasCol.id,
            maxSelect: 1,
          },
          {
            name: 'cliente_id',
            type: 'relation',
            collectionId: clientesCol.id,
            maxSelect: 1,
          },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_reps_empresa_id ON v1_representantes_legais (empresa_id)',
          'CREATE INDEX idx_reps_cliente_id ON v1_representantes_legais (cliente_id)',
          'CREATE INDEX idx_reps_cpf ON v1_representantes_legais (cpf)',
        ],
      })
      app.save(repCol)
    }

    // =========================================================================
    // 3. Garantir F7 Training nas empresas emissoras
    // =========================================================================
    let empresasCol = app.findCollectionByNameOrId('v1_empresas')
    let trendEmpId = ''
    let f7EmpId = ''

    try {
      const trend = app.findFirstRecordByData('v1_empresas', 'nome', 'Trend Consultoria')
      trendEmpId = trend.id
      // Atualizar dados completos se faltar endereço
      if (!trend.getString('logradouro')) {
        trend.set('logradouro', 'Rua Senador Souza Naves')
        trend.set('numero', '425')
        trend.set('complemento', 'Sala 801')
        trend.set('bairro', 'Centro')
        trend.set('cep', '86010-160')
        trend.set('email_notificacoes', 'flavio@trendconsultoria.com.br')
        app.save(trend)
      }
    } catch (_) {}

    try {
      const f7 = app.findFirstRecordByData('v1_empresas', 'nome', 'F7 Training')
      f7EmpId = f7.id
    } catch (_) {
      const recF7 = new Record(empresasCol)
      recF7.set('nome', 'F7 Training')
      recF7.set('razao_social', 'F7 Training e Capacitacao Empresarial LTDA')
      recF7.set('cnpj', '38.912.441/0001-52')
      recF7.set('email', 'contato@f7training.com.br')
      recF7.set('telefone', '43991273588')
      recF7.set('cidade', 'Londrina')
      recF7.set('estado', 'PR')
      recF7.set('cep', '86010-160')
      recF7.set('logradouro', 'Rua Senador Souza Naves')
      recF7.set('numero', '425')
      recF7.set('complemento', 'Sala 802')
      recF7.set('bairro', 'Centro')
      recF7.set('email_notificacoes', 'flavio@trendconsultoria.com.br')
      recF7.set('is_principal', false)
      recF7.set('cor_identificacao', '#d97706')
      app.save(recF7)
      f7EmpId = recF7.id
    }

    // =========================================================================
    // 4. Seed representante legal Flávio Moura para Trend Consultoria e F7 Training
    // =========================================================================
    if (trendEmpId) {
      try {
        app.findFirstRecordByFilter(
          'v1_representantes_legais',
          `empresa_id = '${trendEmpId}' && cpf = '222.333.444-55'`,
        )
      } catch (_) {
        const repTrend = new Record(repCol)
        repTrend.set('nome_completo', 'Flávio Moura')
        repTrend.set('nacionalidade', 'brasileiro')
        repTrend.set('estado_civil', 'casado')
        repTrend.set('profissao', 'consultor empresarial')
        repTrend.set('rg', '25.172.699-X (SSP-SP)')
        repTrend.set('cpf', '222.333.444-55')
        repTrend.set('email', 'flavio@trendconsultoria.com.br')
        repTrend.set('telefone', '43991273588')
        repTrend.set('is_principal', true)
        repTrend.set('ativo', true)
        repTrend.set('empresa_id', trendEmpId)
        app.save(repTrend)
      }
    }

    if (f7EmpId) {
      try {
        app.findFirstRecordByFilter(
          'v1_representantes_legais',
          `empresa_id = '${f7EmpId}' && cpf = '222.333.444-55'`,
        )
      } catch (_) {
        const repF7 = new Record(repCol)
        repF7.set('nome_completo', 'Flávio Moura')
        repF7.set('nacionalidade', 'brasileiro')
        repF7.set('estado_civil', 'casado')
        repF7.set('profissao', 'consultor empresarial')
        repF7.set('rg', '25.172.699-X (SSP-SP)')
        repF7.set('cpf', '222.333.444-55')
        repF7.set('email', 'flavio@trendconsultoria.com.br')
        repF7.set('telefone', '43991273588')
        repF7.set('is_principal', true)
        repF7.set('ativo', true)
        repF7.set('empresa_id', f7EmpId)
        app.save(repF7)
      }
    }

    // =========================================================================
    // 5. Criar coleção v1_contratos_treinamento
    // =========================================================================
    try {
      app.findCollectionByNameOrId('v1_contratos_treinamento')
    } catch (_) {
      const empresasCol = app.findCollectionByNameOrId('v1_empresas')
      const clientesCol = app.findCollectionByNameOrId('v1_clientes')

      const contratosCol = new Collection({
        name: 'v1_contratos_treinamento',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          { name: 'numero_contrato', type: 'text', required: true },
          {
            name: 'empresa_id',
            type: 'relation',
            collectionId: empresasCol.id,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'cliente_id',
            type: 'relation',
            collectionId: clientesCol.id,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'representante_contratada_id',
            type: 'relation',
            collectionId: repCol.id,
            maxSelect: 1,
          },
          {
            name: 'representante_contratante_id',
            type: 'relation',
            collectionId: repCol.id,
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            values: ['rascunho', 'emitido', 'pendente_participantes', 'concluido', 'cancelado'],
            maxSelect: 1,
            required: true,
          },
          { name: 'objeto_descricao', type: 'text' },
          { name: 'data_inicio', type: 'date' },
          { name: 'data_termino', type: 'date' },
          { name: 'data_assinatura', type: 'date' },
          { name: 'dias_duracao', type: 'number' },
          { name: 'limite_12_meses_excedido', type: 'bool' },
          { name: 'valor_total', type: 'number' },
          { name: 'carga_horaria_total', type: 'number' },
          { name: 'modulos_json', type: 'json' },
          {
            name: 'formato_geral',
            type: 'select',
            values: ['Presencial', 'Online', 'Hibrido'],
            maxSelect: 1,
          },
          { name: 'local_infraestrutura', type: 'text' },
          { name: 'plataforma_videoconferencia', type: 'text' },
          { name: 'provedor_acesso_plataforma', type: 'text' },
          { name: 'despesas_viagem_ativas', type: 'bool' },
          { name: 'despesas_transporte', type: 'text' },
          { name: 'despesas_hospedagem', type: 'text' },
          { name: 'despesas_alimentacao', type: 'text' },
          { name: 'despesas_deslocamento_local', type: 'text' },
          { name: 'havera_testemunhas', type: 'bool' },
          { name: 'testemunhas_json', type: 'json' },
          { name: 'consultor_responsavel', type: 'text' },
          { name: 'anexo_proposta_numero', type: 'text' },
          { name: 'anexo_proposta_data', type: 'date' },
          { name: 'anexo_proposta_validade', type: 'text' },
          { name: 'anexo_programa_nome', type: 'text' },
          { name: 'anexo_modulos_json', type: 'json' },
          { name: 'declaracao_destinacao_aceite', type: 'bool' },
          { name: 'aceite_data_hora', type: 'date' },
          {
            name: 'aceite_usuario_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'aceite_usuario_nome', type: 'text' },
          { name: 'aceite_ip', type: 'text' },
          { name: 'snapshot_dados_contrato', type: 'json' },
          { name: 'alerta_participantes_pendentes', type: 'bool' },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_contratos_numero ON v1_contratos_treinamento (numero_contrato)',
          'CREATE INDEX idx_contratos_empresa ON v1_contratos_treinamento (empresa_id)',
          'CREATE INDEX idx_contratos_cliente ON v1_contratos_treinamento (cliente_id)',
          'CREATE INDEX idx_contratos_status ON v1_contratos_treinamento (status)',
        ],
      })
      app.save(contratosCol)
    }
  },
  (app) => {
    try {
      const contratosCol = app.findCollectionByNameOrId('v1_contratos_treinamento')
      app.delete(contratosCol)
    } catch (_) {}

    try {
      const repCol = app.findCollectionByNameOrId('v1_representantes_legais')
      app.delete(repCol)
    } catch (_) {}
  },
)
