export type CompanyName = 'Todas' | 'Grupo Flávio Moura' | 'FM Academy' | 'FM Consultoria'

export type TransactionType = 'Receita' | 'Despesa'
export type TransactionStatus = 'Pendente' | 'Pago'

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: TransactionType
  status: TransactionStatus
  company: CompanyName
  bank: string
  performer: 'Eu' | 'Terceiro'
}

export type LeadStatus =
  | 'Prospecção'
  | 'Diagnóstico'
  | 'Proposta'
  | 'Apresentação'
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
  company: CompanyName
}

export interface Session {
  id: string
  date: string
  duration: number // in minutes
  discussion: string
  tasks: string
}

export interface Mentee {
  id: string
  name: string
  company: CompanyName
  contractValue: number
  totalSessions: number
  sessions: Session[]
}

export interface Client {
  id: string
  name: string
  isB2B: boolean
  companyName?: string
  phone: string
  email: string
  birthday?: string
  contacts?: { name: string; role: string; phone: string }[]
}
