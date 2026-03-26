import { supabase } from './supabase/client'
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

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined

  if (!url || !key) {
    console.warn('Supabase variables are missing from environment.')
    return false
  }

  if (url.includes('mock-supabase-url') || key.includes('mock-anon-key')) {
    console.warn('Supabase is configured with mock variables. Please use real credentials.')
    return false
  }

  return true
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

const MOCK_SERVICOS: Servico[] = [
  { id: 'srv-1', nome: 'Sessão de Diagnóstico', duracao_minutos: 60, preco: 0 },
  { id: 'srv-2', nome: 'Consultoria Estratégica', duracao_minutos: 90, preco: 250 },
]

const MOCK_PROFISSIONAIS: Profissional[] = [
  { id: 'prof-1', nome: 'Equipe de Mentoria', especialidade: 'Atendimento Geral' },
]

export const cloudApi = {
  isSupabaseConfigured,
  deals: createCrud<Deal>('pb_deals'),
  transactions: createCrud<Transaction>('pb_transactions'),
  mentees: createCrud<Mentee>('pb_mentees'),
  proposals: createCrud<Proposal>('pb_proposals'),
  servicos: {
    list: async (): Promise<Servico[]> => {
      if (!isSupabaseConfigured()) return MOCK_SERVICOS
      try {
        const { data, error } = await supabase.from('servicos').select('*')
        if (error) {
          console.warn('Tabela de serviços não acessível no Supabase.', error.message)
          return MOCK_SERVICOS
        }
        return data && data.length > 0 ? data : MOCK_SERVICOS
      } catch (e) {
        console.warn('Erro de rede ao buscar serviços.', e)
        return MOCK_SERVICOS
      }
    },
  },
  profissionais: {
    list: async (): Promise<Profissional[]> => {
      if (!isSupabaseConfigured()) return MOCK_PROFISSIONAIS
      try {
        const { data, error } = await supabase.from('profissionais').select('*')
        if (error) {
          console.warn('Tabela de profissionais não acessível no Supabase.', error.message)
          return MOCK_PROFISSIONAIS
        }
        return data && data.length > 0 ? data : MOCK_PROFISSIONAIS
      } catch (e) {
        console.warn('Erro de rede ao buscar profissionais.', e)
        return MOCK_PROFISSIONAIS
      }
    },
  },
  agendamentos: {
    create: async (data: any) => {
      if (!isSupabaseConfigured()) return { ...data, id: crypto.randomUUID() }
      try {
        // Explicitly omit .select() to prevent errors with insert-only policies
        const { error } = await supabase.from('agendamentos').insert([data])
        if (error) {
          console.error('Falha ao salvar agendamento na nuvem:', error.message)
          throw new Error(error.message)
        }
        return { ...data, id: data.id || crypto.randomUUID() }
      } catch (e) {
        console.error('Exceção ao salvar agendamento:', e)
        throw e
      }
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
