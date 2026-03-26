import {
  Mentee,
  TimeSlot,
  Transaction,
  Proposal,
  Deal,
  Client,
  Session,
  Servico,
  Profissional,
} from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const isSupabaseConfigured = () => {
  const hasUrl = typeof SUPABASE_URL === 'string' && SUPABASE_URL.trim() !== ''
  const hasKey = typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.trim() !== ''
  const isMockUrl = hasUrl && SUPABASE_URL.includes('mock-supabase-url')
  const isMockKey = hasKey && SUPABASE_ANON_KEY.includes('mock-anon-key')

  if (!hasUrl || !hasKey) {
    console.warn('Supabase variables are missing from environment.')
    return false
  }

  if (isMockUrl || isMockKey) {
    console.warn('Supabase is configured with mock variables. Please use real credentials.')
    return false
  }

  return true
}

const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase configuration missing or invalid. Check your environment variables.')
  }
  const headers = {
    apikey: SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${SUPABASE_ANON_KEY || ''}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...options.headers,
  }
  return fetch(`${SUPABASE_URL}${endpoint}`, { ...options, headers })
}

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

// For Production: Clear out any previous test data to ensure a clean state
const clearTestDataForProduction = () => {
  if (!localStorage.getItem('pb_prod_ready')) {
    localStorage.removeItem('pb_deals')
    localStorage.removeItem('pb_transactions')
    localStorage.removeItem('pb_proposals')
    localStorage.removeItem('pb_clients')
    localStorage.removeItem('pb_sessions')
    localStorage.removeItem('pb_mentees')
    localStorage.removeItem('pb_servicos')
    localStorage.removeItem('pb_profissionais')
    localStorage.setItem('pb_prod_ready', 'true')
  }
}
clearTestDataForProduction()

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
  isSupabaseConfigured,
  deals: createCrud<Deal>('pb_deals'),
  transactions: createCrud<Transaction>('pb_transactions'),
  mentees: createCrud<Mentee>('pb_mentees'),
  proposals: createCrud<Proposal>('pb_proposals'),
  servicos: {
    list: async (): Promise<Servico[]> => {
      if (!isSupabaseConfigured()) return []
      const res = await supabaseFetch('/rest/v1/servicos?select=*')
      if (!res.ok) throw new Error('Fetch failed for servicos')
      return await res.json()
    },
  },
  profissionais: {
    list: async (): Promise<Profissional[]> => {
      if (!isSupabaseConfigured()) return []
      const res = await supabaseFetch('/rest/v1/profissionais?select=*')
      if (!res.ok) throw new Error('Fetch failed for profissionais')
      return await res.json()
    },
  },
  agendamentos: {
    create: async (data: any) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const res = await supabaseFetch('/rest/v1/agendamentos', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      return res.json()
    },
  },
  timeSlots: {
    ...createCrud<TimeSlot>('pb_timeSlots'),
    list: async (): Promise<TimeSlot[]> => {
      await delay(150)
      let items = JSON.parse(localStorage.getItem('pb_timeSlots') || '[]')

      if (items.length === 0) {
        const today = new Date()
        for (let i = 1; i <= 14; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          if (date.getDay() === 0 || date.getDay() === 6) continue
          const dateStr = date.toISOString().split('T')[0]
          items.push(
            { id: `slot-${i}-1`, date: dateStr, time: '09:00', isBooked: false },
            { id: `slot-${i}-2`, date: dateStr, time: '14:00', isBooked: false },
            { id: `slot-${i}-3`, date: dateStr, time: '16:00', isBooked: false },
          )
        }
        localStorage.setItem('pb_timeSlots', JSON.stringify(items))
      }
      return items
    },
    book: async (
      data: Partial<TimeSlot> & {
        servico_id?: string
        profissional_id?: string
        cliente_nome?: string
        cliente_telefone?: string
      },
    ): Promise<void> => {
      const items = JSON.parse(localStorage.getItem('pb_timeSlots') || '[]')
      const index = items.findIndex((t: TimeSlot) => t.id === data.id)
      if (index > -1) {
        items[index] = { ...items[index], isBooked: true, ...data }
        localStorage.setItem('pb_timeSlots', JSON.stringify(items))
      }
    },
  },
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
