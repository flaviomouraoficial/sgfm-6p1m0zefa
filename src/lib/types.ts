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
  clientId?: string // Legacy reference
  date: string
  notes?: string // Legacy reference
  createdAt?: string

  // New Mentoring Session properties
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
}

export type Transaction = {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
  category: string
  status: 'pending' | 'completed'
}
