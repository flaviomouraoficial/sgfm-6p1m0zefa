import pb from '@/lib/pocketbase/client'
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

const createPbCrud = <T extends { id: string }>(collectionName: string) => ({
  list: async (): Promise<T[]> => {
    try {
      return await pb.collection(collectionName).getFullList<T>()
    } catch {
      return []
    }
  },
  get: async (id: string): Promise<T | undefined> => {
    try {
      return await pb.collection(collectionName).getOne<T>(id)
    } catch {
      return undefined
    }
  },
  create: async (data: any): Promise<T> => {
    return pb.collection(collectionName).create<T>(data)
  },
  update: async (id: string, data: Partial<T>): Promise<T> => {
    return pb.collection(collectionName).update<T>(id, data)
  },
  delete: async (id: string): Promise<void> => {
    await pb.collection(collectionName).delete(id)
  },
})

export const cloudApi = {
  isSupabaseConfigured: () => true,
  deals: createPbCrud<Deal>('v1_deals'),
  transactions: createPbCrud<Transaction>('v1_transactions'),
  mentees: createPbCrud<Mentee>('v1_mentees'),
  proposals: createPbCrud<Proposal>('v1_proposals'),
  clients: createPbCrud<Client>('v1_clientes'),
  sessions: createPbCrud<Session>('v1_sessoes'),
  servicos: {
    list: async () => {
      try {
        return await pb.collection('v1_servicos').getFullList<Servico>()
      } catch {
        return []
      }
    },
  },
  profissionais: {
    list: async () => {
      try {
        return await pb.collection('v1_profissionais').getFullList<Profissional>()
      } catch {
        return []
      }
    },
  },
  timeSlots: {
    ...createPbCrud<TimeSlot>('v1_time_slots'),
    book: async (data: any) => {
      await pb.collection('v1_time_slots').update(data.id, { isBooked: true, ...data })
    },
  },
  agendamentos: {
    create: async (data: any) => pb.collection('v1_agendamentos').create(data),
  },
  settings: {
    get: async () => {
      try {
        const records = await pb.collection('settings_store').getList(1, 1)
        if (records.items.length > 0) {
          return records.items[0].data || {}
        }
        return {}
      } catch {
        return {}
      }
    },
    save: async (data: any) => {
      const records = await pb.collection('settings_store').getList(1, 1)
      if (records.items.length > 0) {
        await pb.collection('settings_store').update(records.items[0].id, { data })
      } else {
        await pb.collection('settings_store').create({ data })
      }
      return data
    },
  },
  forecasts: {
    get: async () => {
      try {
        const records = await pb.collection('forecasts_store').getList(1, 1)
        if (records.items.length > 0) {
          return records.items[0].data || []
        }
        return []
      } catch {
        return []
      }
    },
    save: async (data: any[]) => {
      const records = await pb.collection('forecasts_store').getList(1, 1)
      if (records.items.length > 0) {
        await pb.collection('forecasts_store').update(records.items[0].id, { data })
      } else {
        await pb.collection('forecasts_store').create({ data })
      }
      return data
    },
  },
}
