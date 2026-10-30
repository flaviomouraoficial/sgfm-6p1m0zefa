import { RepresentanteLegal, Empresa, Client } from './types'

export type FormatoModulo = 'Presencial' | 'Online' | 'Híbrido'

export type ParticipanteNominal = {
  id?: string
  nome_completo: string
  cpf: string
}

export type ModuloContrato = {
  id: string
  ordem: number
  servico: string // "Módulo 1 – LIDERANÇA EFICAZ" ou "Treinamento In Company"
  data_ou_periodo: string // "03/10/2026, das 8h às 12h" ou "03/10/2026 a 10/10/2026"
  data_referencia_inicio?: string // YYYY-MM-DD para cálculo de prazos e multas (Parágrafo quarto da Cláusula Segunda)
  carga_horaria_horas: number // Ex: 4
  formato: FormatoModulo
  participantes_max: number // Ex: 90 ou 4
  valor_parcela: number // Ex: 4000
  vencimento: string // "10/10/2026" ou YYYY-MM-DD
  participantes_nominais?: ParticipanteNominal[]
}

export type TestemunhaContrato = {
  nome: string
  rg: string
}

export type ModuloAnexo = {
  id: string
  titulo: string
  carga_horaria: string
  topicos: string[]
}

export type StatusContrato =
  | 'rascunho'
  | 'emitido'
  | 'pendente_participantes'
  | 'concluido'
  | 'cancelado'

export type ContratoTreinamento = {
  id: string
  numero_contrato: string
  empresa_id: string
  cliente_id: string
  representante_contratada_id?: string
  representante_contratante_id?: string
  status: StatusContrato

  // Etapa 2: Objeto e vigência
  objeto_descricao: string
  data_inicio: string // YYYY-MM-DD
  data_termino: string // YYYY-MM-DD
  data_assinatura?: string // YYYY-MM-DD
  dias_duracao?: number
  limite_12_meses_excedido?: boolean

  // Etapa 3: Módulos
  valor_total: number
  carga_horaria_total: number
  modulos_json: ModuloContrato[]

  // Etapa 4: Condições específicas
  formato_geral: 'Presencial' | 'Online' | 'Hibrido'
  local_infraestrutura?: string
  plataforma_videoconferencia?: string
  provedor_acesso_plataforma?: string

  despesas_viagem_ativas: boolean
  despesas_transporte?: string
  despesas_hospedagem?: string
  despesas_alimentacao?: string
  despesas_deslocamento_local?: string

  havera_testemunhas: boolean
  testemunhas_json?: TestemunhaContrato[]
  consultor_responsavel: string

  // Etapa 5: Anexo Único
  anexo_proposta_numero?: string
  anexo_proposta_data?: string
  anexo_proposta_validade?: string
  anexo_programa_nome?: string
  anexo_modulos_json?: ModuloAnexo[]

  // Etapa 1 / Aceite & Auditoria
  declaracao_destinacao_aceite: boolean
  aceite_data_hora?: string
  aceite_usuario_id?: string
  aceite_usuario_nome?: string
  aceite_ip?: string

  snapshot_dados_contrato?: any
  alerta_participantes_pendentes?: boolean
  observacoes?: string

  created?: string
  updated?: string

  expand?: {
    empresa_id?: Empresa
    cliente_id?: Client
    representante_contratada_id?: RepresentanteLegal
    representante_contratante_id?: RepresentanteLegal
  }
}

export type SimulacaoEncargosResult = {
  tipo: 'modulo' | 'programa' | 'atraso'
  diasAntecedencia?: number
  percentualMulta?: number
  valorMulta: number
  verbaRescisoria?: number
  valorTotalEncargos: number
  detalhes: string[]
}
