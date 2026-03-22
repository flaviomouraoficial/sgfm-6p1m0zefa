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
  clientId?: string
  date: string
  notes?: string
  createdAt?: string
  type?: string
  duration?: number
  discussion?: string
  tasks?: string
  status?: string
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
  menteeCompany?: string
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
}
