export type TransactionType = 'Receita' | 'Despesa'
export type TransactionStatus = 'Pendente' | 'Pago'

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: TransactionType
  status: TransactionStatus
  company: string
  bank: string
  service: string
  performer: 'Eu' | 'Terceiro'
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

export interface Client {
  id: string
  name: string
  isB2B: boolean
  companyName?: string
  phone: string
  email: string
  birthday?: string
  contacts?: { name: string; role: string; phone: string; email: string }[]
}
