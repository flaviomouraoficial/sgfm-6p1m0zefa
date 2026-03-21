import { Mentee, TimeSlot, Transaction, Proposal, Deal, Client, Session } from './types'

// Mock PocketBase/Skip Cloud API for persistent storage
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

const migrateOldData = () => {
  const oldStoreStr = localStorage.getItem('gfm-main-store')
  if (oldStoreStr && !localStorage.getItem('pb_migrated')) {
    try {
      const parsed = JSON.parse(oldStoreStr)
      const oldStore = parsed.state || parsed
      if (oldStore) {
        if (oldStore.deals) localStorage.setItem('pb_deals', JSON.stringify(oldStore.deals))
        if (oldStore.transactions)
          localStorage.setItem('pb_transactions', JSON.stringify(oldStore.transactions))
        if (oldStore.mentees) localStorage.setItem('pb_mentees', JSON.stringify(oldStore.mentees))
        if (oldStore.proposals)
          localStorage.setItem('pb_proposals', JSON.stringify(oldStore.proposals))
        if (oldStore.timeSlots)
          localStorage.setItem('pb_timeSlots', JSON.stringify(oldStore.timeSlots))
        if (oldStore.financialForecasts)
          localStorage.setItem('pb_forecasts', JSON.stringify(oldStore.financialForecasts))

        const settings = {
          systemSettings: oldStore.systemSettings,
          annualRevenueTarget: oldStore.annualRevenueTarget,
          emailConfig: oldStore.emailConfig,
          sessionReminderConfig: oldStore.sessionReminderConfig,
          messageTemplates: oldStore.messageTemplates,
          notificationLogs: oldStore.notificationLogs,
        }
        localStorage.setItem('pb_settings', JSON.stringify(settings))
      }
      localStorage.setItem('pb_migrated', 'true')
    } catch (e) {
      console.error('Migration failed', e)
    }
  }
}

migrateOldData()

const initializeData = () => {
  if (!localStorage.getItem('pb_deals')) {
    localStorage.setItem(
      'pb_deals',
      JSON.stringify([
        {
          id: '1',
          title: 'Consultoria Estratégica',
          clientName: 'Empresa Alpha',
          value: 15000,
          stage: 'contact',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Mentoria Premium',
          clientName: 'João Silva',
          value: 5000,
          stage: 'proposal',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  }
  if (!localStorage.getItem('pb_transactions')) {
    localStorage.setItem(
      'pb_transactions',
      JSON.stringify([
        {
          id: 't1',
          description: 'Mentoria Startup XYZ',
          amount: 15000,
          type: 'Receita',
          date: new Date().toISOString().split('T')[0],
          category: 'Vendas',
          status: 'Pago',
        },
        {
          id: 't2',
          description: 'Licenças de Software',
          amount: 1200,
          type: 'Despesa',
          date: new Date().toISOString().split('T')[0],
          category: 'Ferramentas',
          status: 'Pago',
        },
      ]),
    )
  }
  if (!localStorage.getItem('pb_proposals')) {
    localStorage.setItem(
      'pb_proposals',
      JSON.stringify([
        {
          id: 'p1',
          title: 'Consultoria Estratégica',
          leadId: '1',
          value: 15000,
          expirationDate: '2026-05-01',
          description: 'Proposta inicial de consultoria.',
          status: 'Rascunho',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  }
  if (!localStorage.getItem('pb_clients')) {
    localStorage.setItem(
      'pb_clients',
      JSON.stringify([
        {
          id: 'c1',
          name: 'Maria Souza',
          email: 'maria@exemplo.com',
          phone: '(11) 98888-7777',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  }
  if (!localStorage.getItem('pb_sessions')) {
    localStorage.setItem(
      'pb_sessions',
      JSON.stringify([
        {
          id: 's1',
          clientId: 'c1',
          date: new Date().toISOString(),
          notes: 'Sessão inicial de alinhamento e apresentação do plano de ação.',
          createdAt: new Date().toISOString(),
        },
      ]),
    )
  }
}
initializeData()

const createCrud = <T extends { id: string }>(storageKey: string) => ({
  list: async (): Promise<T[]> => {
    await delay(150)
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  },
  get: async (id: string): Promise<T | undefined> => {
    await delay(100)
    const items: T[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return items.find((item) => item.id === id)
  },
  create: async (data: any): Promise<T> => {
    await delay(250)
    const items = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const newItem = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: data.createdAt || new Date().toISOString(),
    }
    localStorage.setItem(storageKey, JSON.stringify([...items, newItem]))
    return newItem
  },
  update: async (id: string, data: Partial<T>): Promise<T> => {
    await delay(250)
    const items = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const index = items.findIndex((i: any) => i.id === id)
    if (index > -1) {
      items[index] = { ...items[index], ...data }
      localStorage.setItem(storageKey, JSON.stringify(items))
      return items[index]
    }
    throw new Error('Record not found')
  },
  delete: async (id: string): Promise<void> => {
    await delay(250)
    let items = JSON.parse(localStorage.getItem(storageKey) || '[]')
    items = items.filter((i: any) => i.id !== id)
    localStorage.setItem(storageKey, JSON.stringify(items))
  },
})

export const cloudApi = {
  deals: createCrud<Deal>('pb_deals'),
  transactions: createCrud<Transaction>('pb_transactions'),
  mentees: createCrud<Mentee>('pb_mentees'),
  proposals: createCrud<Proposal>('pb_proposals'),
  timeSlots: createCrud<TimeSlot>('pb_timeSlots'),
  clients: createCrud<Client>('pb_clients'),
  sessions: createCrud<Session>('pb_sessions'),
  settings: {
    get: async () => {
      await delay(150)
      return JSON.parse(localStorage.getItem('pb_settings') || '{}')
    },
    save: async (data: any) => {
      await delay(250)
      localStorage.setItem('pb_settings', JSON.stringify(data))
      return data
    },
  },
  forecasts: {
    get: async () => {
      await delay(150)
      return JSON.parse(localStorage.getItem('pb_forecasts') || '[]')
    },
    save: async (data: any[]) => {
      await delay(250)
      localStorage.setItem('pb_forecasts', JSON.stringify(data))
      return data
    },
  },
}
