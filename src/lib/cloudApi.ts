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

  if (!url || !key) return false
  if (url.includes('mock-supabase-url') || key.includes('mock-anon-key')) return false
  return true
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

const createSupabaseCrud = <T extends { id: string }>(tableName: string) => ({
  list: async (): Promise<T[]> => {
    if (!isSupabaseConfigured()) {
      await delay(150)
      return JSON.parse(localStorage.getItem(`pb_${tableName}`) || '[]')
    }
    const { data, error } = await supabase.from(tableName).select('*')
    if (error) {
      console.warn(`Erro ao listar ${tableName}:`, error.message)
      return []
    }
    return data || []
  },
  get: async (id: string): Promise<T | undefined> => {
    if (!isSupabaseConfigured()) {
      await delay(100)
      const items: T[] = JSON.parse(localStorage.getItem(`pb_${tableName}`) || '[]')
      return items.find((item) => item.id === id)
    }
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).limit(1)
    if (error) throw new Error(`Erro ao buscar em ${tableName}: ${error.message}`)
    return data?.[0] || undefined
  },
  create: async (data: any): Promise<T> => {
    const newItem = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: data.createdAt || new Date().toISOString(),
    }
    if (!isSupabaseConfigured()) {
      await delay(250)
      const items = JSON.parse(localStorage.getItem(`pb_${tableName}`) || '[]')
      localStorage.setItem(`pb_${tableName}`, JSON.stringify([...items, newItem]))
      return newItem
    }
    const { data: inserted, error } = await supabase.from(tableName).insert([newItem]).select()
    if (error) {
      console.error(`[DB_ERROR] Falha ao criar no banco (${tableName}):`, error)
      throw new Error(
        `Falha de Escrita no Banco (${tableName}): ${error.message} [Code: ${error.code}]`,
      )
    }
    return inserted?.[0] || newItem
  },
  update: async (id: string, data: Partial<T>): Promise<T> => {
    if (!isSupabaseConfigured()) {
      await delay(250)
      const items = JSON.parse(localStorage.getItem(`pb_${tableName}`) || '[]')
      const index = items.findIndex((i: any) => i.id === id)
      if (index > -1) {
        items[index] = { ...items[index], ...data }
        localStorage.setItem(`pb_${tableName}`, JSON.stringify(items))
        return items[index]
      }
      throw new Error('Record not found')
    }
    const { data: updated, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
    if (error) {
      console.error(`[DB_ERROR] Falha ao atualizar no banco (${tableName}):`, error)
      throw new Error(
        `Falha de Escrita no Banco (${tableName}): ${error.message} [Code: ${error.code}]`,
      )
    }
    return updated?.[0] || (data as T)
  },
  delete: async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      await delay(250)
      let items = JSON.parse(localStorage.getItem(`pb_${tableName}`) || '[]')
      items = items.filter((i: any) => i.id !== id)
      localStorage.setItem(`pb_${tableName}`, JSON.stringify(items))
      return
    }
    const { error } = await supabase.from(tableName).delete().eq('id', id)
    if (error) {
      console.error(`[DB_ERROR] Falha ao deletar no banco (${tableName}):`, error)
      throw new Error(
        `Falha ao Deletar no Banco (${tableName}): ${error.message} [Code: ${error.code}]`,
      )
    }
  },
})

export const cloudApi = {
  isSupabaseConfigured,
  deals: createSupabaseCrud<Deal>('deals'),
  transactions: createSupabaseCrud<Transaction>('transactions'),
  mentees: createSupabaseCrud<Mentee>('mentees'),
  proposals: createSupabaseCrud<Proposal>('proposals'),
  servicos: {
    list: async (): Promise<Servico[]> => {
      if (!isSupabaseConfigured()) return []
      try {
        const { data, error } = await supabase.from('servicos').select('*')
        if (error) {
          console.warn('Tabela de serviços não acessível no Supabase.', error.message)
          return []
        }
        return data || []
      } catch (e) {
        console.warn('Erro de rede ao buscar serviços.', e)
        return []
      }
    },
  },
  profissionais: {
    list: async (): Promise<Profissional[]> => {
      if (!isSupabaseConfigured()) return []
      try {
        const { data, error } = await supabase.from('profissionais').select('*')
        if (error) {
          console.warn('Tabela de profissionais não acessível no Supabase.', error.message)
          return []
        }
        return data || []
      } catch (e) {
        console.warn('Erro de rede ao buscar profissionais.', e)
        return []
      }
    },
  },
  agendamentos: {
    create: async (data: any) => {
      if (!isSupabaseConfigured()) return { ...data, id: crypto.randomUUID() }
      try {
        const dataWithId = { ...data, id: data.id || crypto.randomUUID() }
        const { data: inserted, error } = await supabase
          .from('agendamentos')
          .insert([dataWithId])
          .select()
        if (error) {
          console.error('[DB_ERROR] Falha ao salvar agendamento na nuvem:', error)
          throw new Error(`Erro Supabase: ${error.message} [Code: ${error.code}]`)
        }
        return inserted?.[0] || { ...data, id: data.id || crypto.randomUUID() }
      } catch (e: any) {
        console.error('Exceção ao salvar agendamento:', e)
        throw e
      }
    },
  },
  timeSlots: {
    ...createSupabaseCrud<TimeSlot>('timeSlots'),
    list: async (): Promise<TimeSlot[]> => {
      if (!isSupabaseConfigured()) {
        await delay(150)
        let items = JSON.parse(localStorage.getItem('pb_timeSlots') || '[]')
        return items
      }
      const { data, error } = await supabase.from('timeSlots').select('*')
      if (error) {
        console.warn('Erro timeSlots:', error.message)
        return []
      }
      return data || []
    },
    book: async (
      data: Partial<TimeSlot> & {
        servico_id?: string
        profissional_id?: string
        cliente_nome?: string
        cliente_telefone?: string
      },
    ): Promise<void> => {
      if (!isSupabaseConfigured()) {
        const items = JSON.parse(localStorage.getItem('pb_timeSlots') || '[]')
        const index = items.findIndex((t: TimeSlot) => t.id === data.id)
        if (index > -1) {
          items[index] = { ...items[index], isBooked: true, ...data }
          localStorage.setItem('pb_timeSlots', JSON.stringify(items))
        }
        return
      }

      // Remove campos extras que não pertencem à tabela timeSlots para evitar erros na atualização
      const { servico_id, profissional_id, cliente_nome, cliente_telefone, ...timeSlotData } =
        data as any

      const { error } = await supabase
        .from('timeSlots')
        .update({ isBooked: true, ...timeSlotData })
        .eq('id', data.id)
      if (error) {
        console.error(`[DB_ERROR] Falha ao reservar horário:`, error)
        throw new Error(
          `Falha de Escrita no Banco (timeSlots): ${error.message} [Code: ${error.code}]`,
        )
      }
    },
  },
  clients: createSupabaseCrud<Client>('clients'),
  sessions: createSupabaseCrud<Session>('sessions'),
  settings: {
    get: async () => {
      if (!isSupabaseConfigured()) {
        await delay(150)
        return JSON.parse(localStorage.getItem('pb_settings') || '{}')
      }
      const { data, error } = await supabase
        .from('settings_store')
        .select('*')
        .eq('id', 'main')
        .limit(1)
      if (error) console.warn('Erro ao buscar settings:', error.message)
      return data?.[0]?.data || {}
    },
    save: async (settingsData: any) => {
      if (!isSupabaseConfigured()) {
        await delay(250)
        localStorage.setItem('pb_settings', JSON.stringify(settingsData))
        return settingsData
      }
      const { error } = await supabase
        .from('settings_store')
        .upsert({ id: 'main', data: settingsData })
      if (error) throw new Error(`Erro ao salvar settings: ${error.message}`)
      return settingsData
    },
  },
  forecasts: {
    get: async () => {
      if (!isSupabaseConfigured()) {
        await delay(150)
        return JSON.parse(localStorage.getItem('pb_forecasts') || '[]')
      }
      const { data, error } = await supabase
        .from('forecasts_store')
        .select('*')
        .eq('id', 'main')
        .limit(1)
      if (error) console.warn('Erro ao buscar forecasts:', error.message)
      return data?.[0]?.data || []
    },
    save: async (forecastData: any[]) => {
      if (!isSupabaseConfigured()) {
        await delay(250)
        localStorage.setItem('pb_forecasts', JSON.stringify(forecastData))
        return forecastData
      }
      const { error } = await supabase
        .from('forecasts_store')
        .upsert({ id: 'main', data: forecastData })
      if (error) throw new Error(`Erro ao salvar forecasts: ${error.message}`)
      return forecastData
    },
  },
}
