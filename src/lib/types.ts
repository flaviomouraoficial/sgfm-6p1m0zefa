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
  clientId: string
  date: string
  notes: string
  createdAt: string
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
