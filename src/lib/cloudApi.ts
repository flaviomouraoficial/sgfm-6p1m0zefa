import pb from '@/lib/pocketbase/client'

export const cloudApi = {
  deals: {
    list: () => pb.collection('v1_deals').getFullList(),
    create: (d: any) => pb.collection('v1_deals').create(d),
    update: (id: string, d: any) => pb.collection('v1_deals').update(id, d),
    delete: (id: string) => pb.collection('v1_deals').delete(id),
  },
  transactions: {
    list: () => pb.collection('v1_transactions').getFullList(),
    create: (d: any) => pb.collection('v1_transactions').create(d),
    update: (id: string, d: any) => pb.collection('v1_transactions').update(id, d),
    delete: (id: string) => pb.collection('v1_transactions').delete(id),
  },
  mentees: {
    list: () => pb.collection('v1_mentees').getFullList(),
    create: (d: any) => pb.collection('v1_mentees').create(d),
    update: (id: string, d: any) => pb.collection('v1_mentees').update(id, d),
    delete: (id: string) => pb.collection('v1_mentees').delete(id),
  },
  proposals: {
    list: () => pb.collection('v1_proposals').getFullList(),
    create: (d: any) => pb.collection('v1_proposals').create(d),
    update: (id: string, d: any) => pb.collection('v1_proposals').update(id, d),
    delete: (id: string) => pb.collection('v1_proposals').delete(id),
  },
  timeSlots: {
    list: () => pb.collection('v1_time_slots').getFullList(),
    create: (d: any) => pb.collection('v1_time_slots').create(d),
    update: (id: string, d: any) => pb.collection('v1_time_slots').update(id, d),
    delete: (id: string) => pb.collection('v1_time_slots').delete(id),
    book: (d: any) => pb.collection('v1_time_slots').update(d.id, d),
  },
  clients: {
    list: () => pb.collection('v1_clientes').getFullList(),
    create: (d: any) => pb.collection('v1_clientes').create(d),
    update: (id: string, d: any) => pb.collection('v1_clientes').update(id, d),
    delete: (id: string) => pb.collection('v1_clientes').delete(id),
  },
  sessions: {
    list: () => pb.collection('v1_sessoes').getFullList(),
    create: (d: any) => pb.collection('v1_sessoes').create(d),
    update: (id: string, d: any) => pb.collection('v1_sessoes').update(id, d),
    delete: (id: string) => pb.collection('v1_sessoes').delete(id),
  },
  agendamentos: {
    list: () =>
      pb.collection('v1_agendamentos').getFullList({ expand: 'profissional_id,servico_id' }),
    create: (d: any) => pb.collection('v1_agendamentos').create(d),
    update: (id: string, d: any) => pb.collection('v1_agendamentos').update(id, d),
    delete: (id: string) => pb.collection('v1_agendamentos').delete(id),
  },
  servicos: {
    list: () => pb.collection('v1_servicos').getFullList(),
  },
  profissionais: {
    list: () => pb.collection('v1_profissionais').getFullList(),
  },
  settings: {
    get: async () => {
      try {
        const records = await pb.collection('settings_store').getFullList()
        if (records.length > 0) return records[0].data || {}
        return {}
      } catch {
        return {}
      }
    },
    save: async (data: any) => {
      const records = await pb.collection('settings_store').getFullList()
      if (records.length > 0) {
        return pb.collection('settings_store').update(records[0].id, { data })
      }
      return pb.collection('settings_store').create({ data })
    },
  },
  forecasts: {
    get: async () => {
      try {
        const records = await pb.collection('forecasts_store').getFullList()
        if (records.length > 0) return records[0].data || []
        return []
      } catch {
        return []
      }
    },
    save: async (data: any) => {
      const records = await pb.collection('forecasts_store').getFullList()
      if (records.length > 0) {
        return pb.collection('forecasts_store').update(records[0].id, { data })
      }
      return pb.collection('forecasts_store').create({ data })
    },
  },
}
