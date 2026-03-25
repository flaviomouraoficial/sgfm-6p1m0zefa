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

const getSupabaseHeaders = () => ({
  apikey: SUPABASE_ANON_KEY || '',
  Authorization: `Bearer ${SUPABASE_ANON_KEY || ''}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
})

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
  deals: createCrud<Deal>('pb_deals'),
  transactions: createCrud<Transaction>('pb_transactions'),
  mentees: createCrud<Mentee>('pb_mentees'),
  proposals: createCrud<Proposal>('pb_proposals'),
  servicos: {
    list: async (): Promise<Servico[]> => {
      await delay(150)
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/servicos?select=*`, {
            headers: getSupabaseHeaders(),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.length > 0) return data
          }
        } catch (e) {
          // ignore error, fallback below
        }
      }
      const items = JSON.parse(localStorage.getItem('pb_servicos') || '[]')
      if (items.length === 0) {
        const defaultItems = [
          {
            id: '00000000-0000-0000-0000-000000000001',
            nome: 'Mentoria Padrão',
            duracao: 60,
            preco: 150,
          },
        ]
        localStorage.setItem('pb_servicos', JSON.stringify(defaultItems))
        return defaultItems
      }
      return items
    },
  },
  profissionais: {
    list: async (): Promise<Profissional[]> => {
      await delay(150)
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/profissionais?select=*`, {
            headers: getSupabaseHeaders(),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.length > 0) return data
          }
        } catch (e) {
          // ignore error, fallback below
        }
      }
      const items = JSON.parse(localStorage.getItem('pb_profissionais') || '[]')
      if (items.length === 0) {
        const defaultItems = [
          {
            id: '00000000-0000-0000-0000-000000000002',
            nome: 'Flávio Moura',
            cargo: 'Mentor',
          },
        ]
        localStorage.setItem('pb_profissionais', JSON.stringify(defaultItems))
        return defaultItems
      }
      return items
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
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
          'A conexão com o Supabase não está configurada. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
        )
      }

      const payload = {
        cliente_nome: data.cliente_nome || data.menteeName || 'Nome não informado',
        cliente_telefone: data.cliente_telefone || data.menteePhone || 'Telefone não informado',
        servico_id: data.servico_id,
        profissional_id: data.profissional_id,
        data: data.date,
        hora: data.time,
        status: 'pendente',
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos`, {
        method: 'POST',
        headers: getSupabaseHeaders(),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let errText = res.statusText
        try {
          errText = await res.text()
        } catch {
          // fallback to statusText if text() fails
        }
        throw new Error(`Erro do Supabase (${res.status}): ${errText}`)
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
