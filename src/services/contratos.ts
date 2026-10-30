import pb from '@/lib/pocketbase/client'
import { ContratoTreinamento } from '@/lib/contratos-types'
import { Empresa, Client } from '@/lib/types'

export type AuditoriaCadastralResult = {
  completo: boolean
  pendenciasContratada: string[]
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

  async create(data: Partial<ContratoTreinamento>): Promise<ContratoTreinamento> {
    return pb.collection('v1_contratos_treinamento').create<ContratoTreinamento>(data)
  },

  async update(id: string, data: Partial<ContratoTreinamento>): Promise<ContratoTreinamento> {
    return pb.collection('v1_contratos_treinamento').update<ContratoTreinamento>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('v1_contratos_treinamento').delete(id)
  },

  async gerarProximoNumero(empresaNome?: string): Promise<string> {
    const ano = new Date().getFullYear()
    const prefixo = empresaNome?.toLowerCase().includes('f7') ? 'CT-F7' : 'CT-TREND'
    try {
      const records = await pb.collection('v1_contratos_treinamento').getList(1, 1, {
        filter: `numero_contrato ~ "${ano}"`,
        sort: '-created',
      })
      const total = (records.totalItems || 0) + 1
      const seq = String(total).padStart(3, '0')
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
    const pendenciasContratante: string[] = []

    // 1. Entidade Contratada (Emissora)
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

      // Representante legal da contratada
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
    if (!contratante) {
      pendenciasContratante.push('Cliente Contratante não selecionado')
    } else {
      if (!contratante.name && !contratante.razao_social) {
        pendenciasContratante.push('Razão Social / Nome da Contratante ausente')
      }
      if (!contratante.cnpj) pendenciasContratante.push('CNPJ da Contratante ausente')
      if (!contratante.logradouro && !contratante.cidade) {
        pendenciasContratante.push('Endereço/Cidade da Contratante ausente')
      }
      if (!contratante.email_notificacoes && !contratante.email) {
        pendenciasContratante.push('E-mail para notificações da Contratante ausente')
      }

      // Representante legal da contratante
      if (!repContratante) {
        pendenciasContratante.push('Representante Legal Principal da Contratante não cadastrado')
      } else {
        if (!repContratante.nome_completo)
          pendenciasContratante.push('Nome do representante da Contratante')
        if (!repContratante.nacionalidade)
          pendenciasContratante.push('Nacionalidade do representante da Contratante')
        if (!repContratante.estado_civil)
          pendenciasContratante.push('Estado civil do representante da Contratante')
        if (!repContratante.profissao)
          pendenciasContratante.push('Profissão do representante da Contratante')
        if (!repContratante.rg) pendenciasContratante.push('RG do representante da Contratante')
        if (!repContratante.cpf) pendenciasContratante.push('CPF do representante da Contratante')
        if (!repContratante.email)
          pendenciasContratante.push('E-mail do representante da Contratante')
      }
    }

    const todasPendencias = [...pendenciasContratada, ...pendenciasContratante]

    return {
      completo: todasPendencias.length === 0,
      pendenciasContratada,
      pendenciasContratante,
      todasPendencias,
    }
  },
}
