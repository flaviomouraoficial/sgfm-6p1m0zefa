import pb from '@/lib/pocketbase/client'
import { ContratoTreinamento } from '@/lib/contratos-types'
import { Empresa, Client } from '@/lib/types'

export type AuditoriaCadastralResult = {
  completo: boolean
  bloqueante: boolean
  pendenciasContratada: string[]
  pendenciasContratanteEmpresa: string[]
  pendenciasContratanteRepresentante: string[]
  pendenciasContratante: string[]
  todasPendencias: string[]
}

export const contratosService = {
  async list(): Promise<ContratoTreinamento[]> {
    return pb.collection('v1_contratos_treinamento').getFullList<ContratoTreinamento>({
      sort: '-created',
      expand: 'empresa_id,cliente_id,representante_contratada_id,representante_contratante_id',
    })
  },

  async getById(id: string): Promise<ContratoTreinamento> {
    return pb.collection('v1_contratos_treinamento').getOne<ContratoTreinamento>(id, {
      expand: 'empresa_id,cliente_id,representante_contratada_id,representante_contratante_id',
    })
  },

  /**
   * Sanitiza o payload removendo campos desconhecidos do schema de v1_contratos_treinamento,
   * formatando datas para ISO 8601 válido (ou omitindo), e limpando relations vazias.
   */
  sanitizarPayload(data: Record<string, any>): Record<string, any> {
    const schemaFields = new Set([
      'numero_contrato',
      'empresa_id',
      'cliente_id',
      'representante_contratada_id',
      'representante_contratante_id',
      'status',
      'objeto_descricao',
      'data_inicio',
      'data_termino',
      'data_assinatura',
      'dias_duracao',
      'limite_12_meses_excedido',
      'valor_total',
      'carga_horaria_total',
      'modulos_json',
      'formato_geral',
      'local_infraestrutura',
      'plataforma_videoconferencia',
      'provedor_acesso_plataforma',
      'despesas_viagem_ativas',
      'despesas_transporte',
      'despesas_hospedagem',
      'despesas_alimentacao',
      'despesas_deslocamento_local',
      'havera_testemunhas',
      'testemunhas_json',
      'consultor_responsavel',
      'anexo_proposta_numero',
      'anexo_proposta_data',
      'anexo_proposta_validade',
      'anexo_programa_nome',
      'anexo_modulos_json',
      'declaracao_destinacao_aceite',
      'aceite_data_hora',
      'aceite_usuario_id',
      'aceite_usuario_nome',
      'aceite_ip',
      'snapshot_dados_contrato',
      'alerta_participantes_pendentes',
      'observacoes',
    ])

    const dateFields = new Set([
      'data_inicio',
      'data_termino',
      'data_assinatura',
      'anexo_proposta_data',
      'aceite_data_hora',
    ])

    const relationFields = new Set([
      'empresa_id',
      'cliente_id',
      'representante_contratada_id',
      'representante_contratante_id',
      'aceite_usuario_id',
    ])

    const sanitized: Record<string, any> = {}

    for (const [key, val] of Object.entries(data)) {
      if (!schemaFields.has(key)) continue
      if (val === undefined || val === null) continue

      // Tratar campos de relation: se for string vazia, omite
      if (relationFields.has(key)) {
        if (typeof val === 'string' && val.trim() === '') continue
        sanitized[key] = typeof val === 'string' ? val.trim() : val
        continue
      }

      // Tratar campos date: deve ser ISO válido ou omite
      if (dateFields.has(key)) {
        if (typeof val === 'string' && val.trim() === '') continue
        try {
          const d = new Date(val)
          if (isNaN(d.getTime())) {
            // Data inválida: omitir
            continue
          }
          sanitized[key] = d.toISOString()
        } catch {
          continue
        }
        continue
      }

      sanitized[key] = val
    }

    return sanitized
  },

  async create(
    data: Partial<ContratoTreinamento> | Record<string, any>,
  ): Promise<ContratoTreinamento> {
    const payload = this.sanitizarPayload(data)
    return pb.collection('v1_contratos_treinamento').create<ContratoTreinamento>(payload)
  },

  async update(
    id: string,
    data: Partial<ContratoTreinamento> | Record<string, any>,
  ): Promise<ContratoTreinamento> {
    const payload = this.sanitizarPayload(data)
    return pb.collection('v1_contratos_treinamento').update<ContratoTreinamento>(id, payload)
  },

  /**
   * Salva contrato de forma inteligente: se id for fornecido e existir, atualiza;
   * caso contrário, cria novo registro. Em caso de colisão de numero_contrato ao criar,
   * recalcula o próximo número único e re-tenta.
   */
  async salvarOuAtualizar(
    id: string | undefined | null,
    data: Partial<ContratoTreinamento> | Record<string, any>,
    empresaNome?: string,
  ): Promise<ContratoTreinamento> {
    const cleanPayload = this.sanitizarPayload(data)

    if (id && typeof id === 'string' && id.trim().length > 0) {
      try {
        return await pb
          .collection('v1_contratos_treinamento')
          .update<ContratoTreinamento>(id, cleanPayload)
      } catch (err: any) {
        // Se registro não foi encontrado (404), cai para create
        if (err?.status !== 404) {
          throw err
        }
      }
    }

    // Criar novo registro
    try {
      return await pb
        .collection('v1_contratos_treinamento')
        .create<ContratoTreinamento>(cleanPayload)
    } catch (err: any) {
      // Se deu colisão de número único, recalcular próximo número e tentar novamente
      const errMsg = String(err?.message || '') + JSON.stringify(err?.data || '')
      if (errMsg.includes('numero_contrato') || err?.status === 400) {
        const novoNumero = await this.gerarProximoNumero(empresaNome)
        cleanPayload.numero_contrato = novoNumero
        return await pb
          .collection('v1_contratos_treinamento')
          .create<ContratoTreinamento>(cleanPayload)
      }
      throw err
    }
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('v1_contratos_treinamento').delete(id)
  },

  async gerarProximoNumero(empresaNome?: string): Promise<string> {
    const ano = new Date().getFullYear()
    const prefixo = empresaNome?.toLowerCase().includes('f7') ? 'CT-F7' : 'CT-TREND'
    try {
      // Buscar todos os contratos do ano corrente para encontrar o número sequencial máximo
      const records = await pb.collection('v1_contratos_treinamento').getFullList({
        filter: `numero_contrato ~ "${ano}"`,
        fields: 'numero_contrato',
      })

      let maxSeq = 0
      const regex = new RegExp(`${prefixo}-(\\d+)/${ano}`, 'i')
      const fallbackRegex = new RegExp(`-(\\d+)/${ano}`, 'i')

      for (const rec of records) {
        const numStr = (rec as any).numero_contrato || ''
        const match = numStr.match(regex) || numStr.match(fallbackRegex)
        if (match && match[1]) {
          const val = parseInt(match[1], 10)
          if (!isNaN(val) && val > maxSeq) {
            maxSeq = val
          }
        }
      }

      const seq = String(maxSeq + 1).padStart(3, '0')
      return `${prefixo}-${seq}/${ano}`
    } catch {
      return `${prefixo}-001/${ano}`
    }
  },

  /**
   * PARTE 3 — ETAPA ZERO: auditoria de cadastro
   * Verifica completude da entidade emissora e do cliente contratante
   */
  auditarCadastros(
    contratada: Empresa | null,
    repContratada: any | null,
    contratante: Client | null,
    repContratante: any | null,
  ): AuditoriaCadastralResult {
    const pendenciasContratada: string[] = []
    const pendenciasContratanteEmpresa: string[] = []
    const pendenciasContratanteRepresentante: string[] = []

    // 1. Entidade Contratada (Emissora - Trend ou F7)
    // Exige cadastro completo e representante legal principal completo (bloqueante)
    if (!contratada) {
      pendenciasContratada.push('Entidade emissora (Trend ou F7) não selecionada')
    } else {
      if (!contratada.razao_social) pendenciasContratada.push('Razão Social da Contratada ausente')
      if (!contratada.cnpj) pendenciasContratada.push('CNPJ da Contratada ausente')
      if (!contratada.logradouro && !contratada.endereco) {
        pendenciasContratada.push('Endereço/Logradouro da Contratada ausente')
      }
      if (!contratada.cidade) pendenciasContratada.push('Cidade da Contratada ausente')
      if (!contratada.estado) pendenciasContratada.push('Estado (UF) da Contratada ausente')
      if (!contratada.telefone) pendenciasContratada.push('Telefone da Contratada ausente')
      if (!contratada.email_notificacoes && !contratada.email) {
        pendenciasContratada.push('E-mail para notificações da Contratada ausente')
      }

      // Representante legal da contratada (exigido no cadastro)
      if (!repContratada) {
        pendenciasContratada.push('Representante Legal Principal da Contratada não cadastrado')
      } else {
        if (!repContratada.nome_completo)
          pendenciasContratada.push('Nome do representante da Contratada')
        if (!repContratada.nacionalidade)
          pendenciasContratada.push('Nacionalidade do representante da Contratada')
        if (!repContratada.estado_civil)
          pendenciasContratada.push('Estado civil do representante da Contratada')
        if (!repContratada.profissao)
          pendenciasContratada.push('Profissão do representante da Contratada')
        if (!repContratada.rg) pendenciasContratada.push('RG do representante da Contratada')
        if (!repContratada.cpf) pendenciasContratada.push('CPF do representante da Contratada')
        if (!repContratada.email) pendenciasContratada.push('E-mail do representante da Contratada')
      }
    }

    // 2. Entidade Contratante (Cliente)
    // 2.1 Dados da Empresa Contratante (Bloqueantes se ausentes)
    if (!contratante) {
      pendenciasContratanteEmpresa.push('Cliente Contratante não selecionado')
    } else {
      if (!contratante.name && !contratante.razao_social) {
        pendenciasContratanteEmpresa.push('Razão Social / Nome da Contratante ausente')
      }
      if (!contratante.cnpj) pendenciasContratanteEmpresa.push('CNPJ da Contratante ausente')
      if (!contratante.logradouro && !contratante.cidade) {
        pendenciasContratanteEmpresa.push('Endereço/Cidade da Contratante ausente')
      }
      if (!contratante.email_notificacoes && !contratante.email) {
        pendenciasContratanteEmpresa.push('E-mail para notificações da Contratante ausente')
      }

      // 2.2 Representante legal da contratante
      // Não bloqueia a emissão: pode ser preenchido/sobrescrito pontualmente no fluxo do contrato
      if (!repContratante) {
        pendenciasContratanteRepresentante.push(
          'Representante legal da Contratante não cadastrado (será preenchido na geração do contrato)',
        )
      } else {
        if (!repContratante.nome_completo)
          pendenciasContratanteRepresentante.push('Nome do representante da Contratante')
        if (!repContratante.nacionalidade)
          pendenciasContratanteRepresentante.push('Nacionalidade do representante da Contratante')
        if (!repContratante.estado_civil)
          pendenciasContratanteRepresentante.push('Estado civil do representante da Contratante')
        if (!repContratante.profissao)
          pendenciasContratanteRepresentante.push('Profissão do representante da Contratante')
        if (!repContratante.rg)
          pendenciasContratanteRepresentante.push('RG do representante da Contratante')
        if (!repContratante.cpf)
          pendenciasContratanteRepresentante.push('CPF do representante da Contratante')
        if (!repContratante.email)
          pendenciasContratanteRepresentante.push('E-mail do representante da Contratante')
      }
    }

    const pendenciasContratante = [
      ...pendenciasContratanteEmpresa,
      ...pendenciasContratanteRepresentante,
    ]
    const todasPendencias = [...pendenciasContratada, ...pendenciasContratante]

    // Bloqueia SOMENTE se houver pendências na Contratada ou nos dados de empresa da Contratante
    const bloqueante = pendenciasContratada.length > 0 || pendenciasContratanteEmpresa.length > 0

    return {
      completo: todasPendencias.length === 0,
      bloqueante,
      pendenciasContratada,
      pendenciasContratanteEmpresa,
      pendenciasContratanteRepresentante,
      pendenciasContratante,
      todasPendencias,
    }
  },
}
