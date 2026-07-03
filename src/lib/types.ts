export type Client = {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  createdAt: string
}

export type Session = {
  id: string
  mentee_id?: string
  client_id?: string
  agendamento_id?: string
  date: string
  projeto?: string
  notes?: string
  type?: string
  duration?: number
  status?: string
  discussion?: string
  tasks?: string
  created?: string
  updated?: string
  expand?: {
    mentee_id?: Mentee
    client_id?: Client
    agendamento_id?: Agendamento
  }
}

export type MenteeStatus = 'Ativo' | 'Concluído' | 'Pausado'

export type Mentee = {
  id: string
  name: string
  company: string
  contractValue: number
  totalSessions: number
  status: MenteeStatus
  phone: string
  email: string
  sessions: Session[]
  emailLogs: any[]
  attachments?: any[]
}

export type TimeSlot = {
  id: string
  date: string
  time: string
  description?: string
  isBooked: boolean
  menteeName?: string
  menteeEmail?: string
  menteePhone?: string
  menteeCompany?: string
  service?: string
  professional?: string
}

export type Deal = {
  id: string
  title: string
  clientName: string
  value: number
  stage: 'lead' | 'contact' | 'proposal' | 'won' | 'lost'
  createdAt: string
  phone?: string
  email?: string
  notes?: string
}

export type ProposalStatus = 'Rascunho' | 'Enviada' | 'Aceita' | 'Rejeitada'

export type Proposal = {
  id: string
  title: string
  leadId: string
  value: number
  expirationDate: string
  description: string
  status: ProposalStatus
  createdAt: string
}

export type TransactionType = 'Receita' | 'Despesa'
export type TransactionStatus = 'Pendente' | 'Pago'

export type Attachment = {
  id: string
  name: string
  type: string
  url: string
}

export type ContaFinanceira = {
  id: string
  nome: string
  tipo: 'Corrente' | 'Poupança' | 'Caixa' | 'Investimento'
  saldo_inicial: number
  created?: string
  updated?: string
}

export type Transaction = {
  id: string
  description: string
  amount: number
  type: TransactionType
  date: string
  entryDate?: string
  classification?: string
  category: string
  status: TransactionStatus
  company?: string
  bank?: string
  service?: string
  paymentMethod?: string
  performer?: string
  client?: string
  supplier?: string
  paymentLink?: string
  attachments?: Attachment[]
  recurringGroupId?: string
  recurrence?: { frequency: string; current: number; total: number }
  updatedAt?: string
  conta_id?: string
  conciliado?: boolean
  recibo_id?: string
  document_number?: string
  expand?: {
    conta_id?: ContaFinanceira
  }
}

export type Servico = {
  id: string
  nome: string
  duracao_minutos: number
  preco: number
  created_at?: string
}

export type Profissional = {
  id: string
  nome: string
  especialidade?: string
  created_at?: string
}

export type Agendamento = {
  id: string
  profissional_id: string
  servico_id: string
  data_horario: string
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  status: string
  created_at?: string
  expand?: {
    profissional_id?: Profissional
    servico_id?: Servico
  }
}

export type BookCategory = 'Ficção' | 'Biografia' | 'Autodesenvolvimento' | 'Técnico' | 'Outras'
export type BookReadStatus = 'Não lido' | 'Lendo' | 'Lido'

export type Book = {
  id: string
  titulo: string
  autor: string
  categoria: BookCategory
  palavras_chave?: string
  descricao?: string
  observacoes?: string
  status_leitura: BookReadStatus
  favorito: boolean
  capa_file?: string
  capa_url?: string
  created: string
  updated: string
}

export type ReciboItem = {
  descricao: string
  qtd: number
  valor_unitario: number
  total: number
}

export type Recibo = {
  id: string
  numero: string
  tipo: 'Receber' | 'Pagar'
  status: string
  data_criacao: string
  cliente_nome: string
  cliente_documento?: string
  nf_numero?: string
  nf_data?: string
  nf_descricao?: string
  nf_valor_total?: number
  banco?: string
  agencia_conta?: string
  itens: ReciboItem[]
  subtotal: number
  created?: string
  updated?: string
}

export type AssessmentLink = {
  id: string
  cliente_id: string
  link_unico: string
  quantidade_permitida: number
  quantidade_usada: number
  status: 'ativo' | 'inativo' | 'expirado'
  data_expiracao?: string
  criado_por: string
  created: string
  updated: string
  expand?: {
    cliente_id?: Client
  }
}

export type AssessmentResposta = {
  id: string
  link_id: string
  cliente_id: string
  nome_respondente: string
  email_respondente: string
  grau_parentesco: string
  atua_na_organizacao: boolean
  respostas_json: Record<string, number>
  status: 'completo' | 'incompleto' | 'em_progresso'
  created: string
  updated: string
  expand?: {
    link_id?: AssessmentLink
    cliente_id?: Client
  }
}

export type AssessmentCalculo = {
  id: string
  resposta_id: string
  pilar_1_media: number
  pilar_2_media: number
  pilar_3_media: number
  pilar_4_media: number
  pilar_5_media: number
  pilar_6_media: number
  pilar_7_media: number
  pilar_8_media: number
  pilar_9_media: number
  mapeamento_agro_media: number
  estado_sucessao: 'verde' | 'amarelo' | 'vermelho'
  created: string
  updated: string
  expand?: {
    resposta_id?: AssessmentResposta
  }
}
