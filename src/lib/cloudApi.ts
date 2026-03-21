import { Client, Session, Deal, Transaction } from './types'

// Simulate network delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

// Initialize mock data in localStorage
const initializeData = () => {
  if (!localStorage.getItem('gfm_clients')) {
    localStorage.setItem(
      'gfm_clients',
      JSON.stringify([
        {
          id: '1',
          name: 'Maria Oliveira',
          email: 'maria@example.com',
          phone: '(11) 98888-7777',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Carlos Santos',
          email: 'carlos@example.com',
          phone: '(11) 97777-6666',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  }
  if (!localStorage.getItem('gfm_sessions')) {
    localStorage.setItem(
      'gfm_sessions',
      JSON.stringify([
        {
          id: '1',
          clientId: '1',
          date: new Date().toISOString(),
          notes: 'Primeira sessão de alinhamento. Metas definidas para o trimestre.',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  }
  if (!localStorage.getItem('gfm_deals')) {
    localStorage.setItem(
      'gfm_deals',
      JSON.stringify([
        {
          id: '1',
          title: 'Mentoria Premium',
          clientName: 'Empresa XYZ',
          value: 5000,
          stage: 'proposal',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Consultoria Financeira',
          clientName: 'João Silva',
          value: 2500,
          stage: 'lead',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  }
  if (!localStorage.getItem('gfm_transactions')) {
    localStorage.setItem(
      'gfm_transactions',
      JSON.stringify([
        {
          id: '1',
          description: 'Pagamento Mentoria',
          amount: 5000,
          type: 'income',
          date: new Date().toISOString(),
          category: 'Vendas',
          status: 'completed',
        },
        {
          id: '2',
          description: 'Software CRM',
          amount: 150,
          type: 'expense',
          date: new Date().toISOString(),
          category: 'Ferramentas',
          status: 'completed',
        },
      ]),
    )
  }
}

initializeData()

// Generic CRUD helper
const createCrud = <T extends { id: string }>(storageKey: string) => ({
  list: async (): Promise<T[]> => {
    await delay(300)
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  },
  get: async (id: string): Promise<T | undefined> => {
    await delay(200)
    const items: T[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return items.find((item) => item.id === id)
  },
  create: async (data: Omit<T, 'id' | 'createdAt'>): Promise<T> => {
    await delay(400)
    const items: T[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const newItem = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    } as unknown as T
    localStorage.setItem(storageKey, JSON.stringify([...items, newItem]))
    return newItem
  },
  update: async (id: string, data: Partial<T>): Promise<T> => {
    await delay(400)
    let items: T[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) throw new Error('Not found')
    items[index] = { ...items[index], ...data }
    localStorage.setItem(storageKey, JSON.stringify(items))
    return items[index]
  },
  delete: async (id: string): Promise<void> => {
    await delay(400)
    let items: T[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    items = items.filter((item) => item.id !== id)
    localStorage.setItem(storageKey, JSON.stringify(items))
  },
})

export const cloudApi = {
  clients: createCrud<Client>('gfm_clients'),
  sessions: createCrud<Session>('gfm_sessions'),
  deals: createCrud<Deal>('gfm_deals'),
  transactions: createCrud<Transaction>('gfm_transactions'),
}
