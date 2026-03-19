export type TransactionType = 'Receita' | 'Despesa'
export type TransactionStatus = 'Pendente' | 'Pago'

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
}

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string // Data de Vencimento
  entryDate?: string // Data de Lançamento
  type: TransactionType
  status: TransactionStatus
  company: string
  bank: string
  performer: 'Eu' | 'Terceiro'
  paymentMethod: string
  client?: string
  service?: string
  supplier?: string
  category?: string
  paymentLink?: string
  updatedAt?: string
  attachments?: Attachment[]
  recurringGroupId?: string
  recurrence?: {
    frequency: 'Mensal' | 'Trimestral' | 'Anual'
    current: number
    total: number
  }
}

export type LeadStatus =
  | 'Prospecção'
  | 'Reunião de Diagnóstico'
  | 'Geração de Proposta'
  | 'Apresentação da Proposta'
  | 'Negociando'
  | 'Fechado'
  | 'Perdido'

export interface Lead {
  id: string
  name: string
  value: number
  targetDate: string
  status: LeadStatus
  phone: string
  email: string
  company: string
}

export interface Session {
  id: string
  date: string
  duration: number // in minutes
  discussion: string
  tasks: string
}

export type MenteeStatus = 'Ativo' | 'Concluído' | 'Pausado'

export interface Mentee {
  id: string
  name: string
  company: string
  contractValue: number
  totalSessions: number
  sessions: Session[]
  status: MenteeStatus
  phone?: string
  email?: string
}

export interface Interaction {
  id: string
  date: string
  note: string
}

export interface Client {
  id: string
  name: string
  isB2B: boolean
  companyName?: string
  phone: string
  email: string
  birthday?: string
  notes?: string
  contacts?: { name: string; role: string; phone: string; email: string }[]
  interactions?: Interaction[]
  status?: 'Ativo' | 'Inativo'
}

export interface TimeSlot {
  id: string
  date: string
  time: string
  isBooked: boolean
  menteeName?: string
  menteeEmail?: string
  menteeCompany?: string
}
