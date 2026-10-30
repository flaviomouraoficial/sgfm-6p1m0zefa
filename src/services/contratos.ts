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
