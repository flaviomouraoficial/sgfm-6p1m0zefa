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
