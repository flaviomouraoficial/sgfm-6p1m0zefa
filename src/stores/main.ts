import { create } from 'zustand'
import {
  Mentee,
  TimeSlot,
  Transaction,
  Session,
  Proposal,
  Deal,
  Client,
  Servico,
  Profissional,
  Agendamento,
} from '@/lib/types'
import pb from '@/lib/pocketbase/client'

export interface FinancialForecast {
  month: string
  expectedIncome: number
  expectedExpense: number
}

interface MainState {
  currentPath: string
  setCurrentPath: (p: string) => void

  deals: Deal[]
  mentees: Mentee[]
  timeSlots: TimeSlot[]
  agendamentos: Agendamento[]
  transactions: Transaction[]
  proposals: Proposal[]
  clients: Client[]
  clientSessions: Session[]
  financialForecasts: FinancialForecast[]
  annualRevenueTarget: number
  systemSettings: {
    logo: string
    companyName: string
    contactPhone: string
    contactEmail: string
    defaultDuration?: number
  }

  services: string[]
  servicos: Servico[]
  profissionais: Profissional[]

  sessionTypes: string[]
  companies: string[]
  company: string
  banks: string[]
  expenseCategories: string[]
  investmentCategories: string[]
  paymentMethods: string[]

  emailConfig: any
  sessionReminderConfig: any
  messageTemplates: any
  notificationLogs: any[]
  isInitialLoad: boolean
  isPublicDataLoaded: boolean
  isSyncing: boolean
  publicDataError: string | null

  syncData: () => Promise<void>
  syncPublicData: () => Promise<void>
  fetchTransactions: () => Promise<void>
  fetchTimeSlots: () => Promise<void>
  fetchAgendamentos: () => Promise<void>
  fetchMenteesAndClients: () => Promise<void>
  fetchProposals: () => Promise<void>
  fetchDeals: () => Promise<void>

  addListValue: (
    listKey:
      | 'services'
      | 'sessionTypes'
      | 'companies'
      | 'banks'
      | 'expenseCategories'
      | 'investmentCategories'
      | 'paymentMethods',
    value: string,
  ) => Promise<void>
  removeListValue: (
    listKey:
      | 'services'
      | 'sessionTypes'
      | 'companies'
      | 'banks'
      | 'expenseCategories'
      | 'investmentCategories'
      | 'paymentMethods',
    value: string,
  ) => Promise<void>

  addDeal: (d: Partial<Deal>) => Promise<void>
  updateDeal: (id: string, d: Partial<Deal>) => Promise<void>
  removeDeal: (id: string) => Promise<void>

  addMentee: (m: Mentee) => Promise<void>
  updateMentee: (id: string, data: Partial<Mentee>) => Promise<void>
  removeMentee: (id: string) => Promise<void>
  addMenteeSession: (menteeId: string, session: Session) => Promise<void>
  updateMenteeSession: (
    menteeId: string,
    sessionId: string,
    data: Partial<Session>,
  ) => Promise<void>
  removeMenteeSession: (menteeId: string, sessionId: string) => Promise<void>
  addMenteeEmailLog: (menteeId: string, log: any) => Promise<void>

  addTimeSlot: (slot: Omit<TimeSlot, 'id'>) => Promise<void>
  updateTimeSlot: (id: string, data: Partial<TimeSlot>) => Promise<void>
  removeTimeSlot: (id: string) => Promise<void>
  bookTimeSlot: (
    id: string,
    name: string,
    email: string,
    phone: string,
    topic: string,
  ) => Promise<void>
  unbookTimeSlot: (id: string) => Promise<void>

  addTransaction: (tx: Partial<Transaction>) => Promise<void>
  addTransactions: (txs: Partial<Transaction>[]) => Promise<void>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  removeTransaction: (id: string) => Promise<void>

  addClient: (c: Partial<Client>) => Promise<void>
  updateClient: (id: string, c: Partial<Client>) => Promise<void>
  removeClient: (id: string) => Promise<void>
  addClientSession: (s: Partial<Session>) => Promise<void>
  updateClientSession: (id: string, s: Partial<Session>) => Promise<void>
  removeClientSession: (id: string) => Promise<void>

  addService: (s: string) => Promise<void>
  addExpenseCategory: (c: string) => Promise<void>
  addInvestmentCategory: (c: string) => Promise<void>
  addCompany: (c: string) => Promise<void>

  addProposal: (p: Proposal) => Promise<void>
  updateProposal: (id: string, data: Partial<Proposal>) => Promise<void>
  removeProposal: (id: string) => Promise<void>

  setSystemSettings: (settings: Partial<MainState['systemSettings']>) => Promise<void>
  setAnnualRevenueTarget: (t: number) => Promise<void>
  setFinancialForecasts: (f: FinancialForecast[]) => Promise<void>
  setMessageTemplates: (t: any) => Promise<void>
  setSessionReminderConfig: (c: any) => Promise<void>
}

export const useMainStore = create<MainState>()((set, get) => {
  const updateSettingsData = async (partialData: any) => {
    const records = await pb.collection('settings_store').getFullList()
    const currentData = records[0]?.data || {}
    const newData = { ...currentData, ...partialData }
    if (records.length > 0) {
      await pb.collection('settings_store').update(records[0].id, { data: newData })
    } else {
      await pb.collection('settings_store').create({ data: newData })
    }
    return newData
  }

  return {
    currentPath: '/admin',
    setCurrentPath: (p) => set({ currentPath: p }),

    deals: [],
    mentees: [],
    timeSlots: [],
    agendamentos: [],
    transactions: [],
    proposals: [],
    clients: [],
    clientSessions: [],
    financialForecasts: [],
    annualRevenueTarget: 300000,
    systemSettings: {
      logo: '',
      companyName: 'Grupo Flávio Moura',
      contactPhone: '',
      contactEmail: '',
      defaultDuration: 60,
    },

    services: [],
    servicos: [],
    profissionais: [],

    sessionTypes: [],
    companies: [],
    company: 'Todas',
    banks: [],
    expenseCategories: [],
    investmentCategories: [],
    paymentMethods: [],

    emailConfig: { provider: 'Nenhum', apiKey: '' },
    sessionReminderConfig: {
      enabled: false,
      hoursBefore: 24,
      channels: { email: true, whatsapp: false },
    },
    messageTemplates: {
      emailSubject: 'Sua Mentoria com Flávio Moura',
      emailBody: 'Olá,\n\nEste é um lembrete.',
      defaultMeetingLink: '',
    },
    notificationLogs: [],
    isInitialLoad: true,
    isPublicDataLoaded: false,
    isSyncing: false,
    publicDataError: null,

    syncData: async () => {
      set({ isSyncing: true })
      try {
        const [
          deals,
          transactions,
          mentees,
          proposals,
          timeSlots,
          settingsRecords,
          forecastsRecords,
          clients,
          sessoes,
          agendamentos,
          servicos,
          profissionais,
        ] = await Promise.all([
          pb.collection('v1_deals').getFullList(),
          pb.collection('v1_transactions').getFullList(),
          pb.collection('v1_mentees').getFullList(),
          pb.collection('v1_proposals').getFullList(),
          pb.collection('v1_time_slots').getFullList(),
          pb.collection('settings_store').getFullList(),
          pb.collection('forecasts_store').getFullList(),
          pb.collection('v1_clientes').getFullList(),
          pb.collection('v1_sessoes').getFullList(),
          pb.collection('v1_agendamentos').getFullList({ expand: 'servico_id,profissional_id' }),
          pb.collection('v1_servicos').getFullList(),
          pb.collection('v1_profissionais').getFullList(),
        ])

        const settings = settingsRecords[0]?.data || {}
        const forecasts = forecastsRecords[0]?.data || []

        const mappedMentees = mentees.map((m: any) => ({
          ...m,
          sessions: sessoes.filter((s: any) => s.mentee_id === m.id),
        }))

        const mappedClients = clients.map((c: any) => ({
          ...c,
          sessions: sessoes.filter((s: any) => s.client_id === c.id),
        }))

        set({
          deals: deals as any,
          transactions: transactions as any,
          mentees: mappedMentees as any,
          proposals: proposals as any,
          timeSlots: timeSlots as any,
          agendamentos: agendamentos as any,
          clients: mappedClients as any,
          clientSessions: sessoes as any,
          servicos: servicos as any,
          profissionais: profissionais as any,

          systemSettings: settings.systemSettings || get().systemSettings,
          annualRevenueTarget: settings.annualRevenueTarget || get().annualRevenueTarget,
          emailConfig: settings.emailConfig || get().emailConfig,
          sessionReminderConfig: settings.sessionReminderConfig || get().sessionReminderConfig,
          messageTemplates: settings.messageTemplates || get().messageTemplates,
          notificationLogs: settings.notificationLogs || [],
          financialForecasts: forecasts.length ? forecasts : get().financialForecasts,

          services: settings.services || [],
          sessionTypes: settings.sessionTypes || [],
          companies: settings.companies || [],
          banks: settings.banks || [],
          expenseCategories: settings.expenseCategories || [],
          investmentCategories: settings.investmentCategories || [],
          paymentMethods: settings.paymentMethods || [],

          isSyncing: false,
          isInitialLoad: false,
        })
      } catch (e) {
        console.error('Erro no syncData', e)
        set({ isSyncing: false, isInitialLoad: false })
      }
    },

    fetchTransactions: async () => {
      try {
        const txs = await pb.collection('v1_transactions').getFullList()
        set({ transactions: txs as any })
      } catch (e) {
        console.error(e)
      }
    },

    fetchTimeSlots: async () => {
      try {
        const slots = await pb.collection('v1_time_slots').getFullList()
        set({ timeSlots: slots as any })
      } catch (e) {
        console.error(e)
      }
    },

    fetchAgendamentos: async () => {
      try {
        const ag = await pb
          .collection('v1_agendamentos')
          .getFullList({ expand: 'servico_id,profissional_id' })
        set({ agendamentos: ag as any })
      } catch (e) {
        console.error(e)
      }
    },

    fetchMenteesAndClients: async () => {
      try {
        const [mentees, clients, sessoes] = await Promise.all([
          pb.collection('v1_mentees').getFullList(),
          pb.collection('v1_clientes').getFullList(),
          pb.collection('v1_sessoes').getFullList(),
        ])
        const mappedMentees = mentees.map((m: any) => ({
          ...m,
          sessions: sessoes.filter((s: any) => s.mentee_id === m.id),
        }))
        const mappedClients = clients.map((c: any) => ({
          ...c,
          sessions: sessoes.filter((s: any) => s.client_id === c.id),
        }))
        set({
          mentees: mappedMentees as any,
          clients: mappedClients as any,
          clientSessions: sessoes as any,
        })
      } catch (e) {
        console.error(e)
      }
    },

    fetchProposals: async () => {
      try {
        const props = await pb.collection('v1_proposals').getFullList()
        set({ proposals: props as any })
      } catch (e) {
        console.error(e)
      }
    },

    fetchDeals: async () => {
      try {
        const deals = await pb.collection('v1_deals').getFullList()
        set({ deals: deals as any })
      } catch (e) {
        console.error(e)
      }
    },

    syncPublicData: async () => {
      set({ isSyncing: true, publicDataError: null })
      try {
        const [timeSlots, settingsRecords, servicos, profissionais] = await Promise.all([
          pb.collection('v1_time_slots').getFullList(),
          pb.collection('settings_store').getFullList(),
          pb.collection('v1_servicos').getFullList(),
          pb.collection('v1_profissionais').getFullList(),
        ])

        const settings = settingsRecords[0]?.data || {}

        set({
          timeSlots: timeSlots as any,
          systemSettings: settings.systemSettings || get().systemSettings,
          services: settings.services || [],
          companies: settings.companies || [],
          servicos: servicos as any,
          profissionais: profissionais as any,
          isSyncing: false,
          isPublicDataLoaded: true,
          publicDataError: null,
        })
      } catch (e: any) {
        set({
          isSyncing: false,
          isPublicDataLoaded: true,
          publicDataError: e.message || 'Falha ao processar os dados públicos.',
          servicos: [],
          profissionais: [],
        })
      }
    },

    addListValue: async (listKey, value) => {
      const state = get() as any
      const currentList = state[listKey] || []
      const newList = Array.from(new Set([...currentList, value]))
      await updateSettingsData({ [listKey]: newList })
      set({ [listKey]: newList })
    },
    removeListValue: async (listKey, value) => {
      const state = get() as any
      const currentList = state[listKey] || []
      const newList = currentList.filter((item: string) => item !== value)
      await updateSettingsData({ [listKey]: newList })
      set({ [listKey]: newList })
    },

    addService: async (s) => get().addListValue('services', s),
    addExpenseCategory: async (c) => get().addListValue('expenseCategories', c),
    addInvestmentCategory: async (c) => get().addListValue('investmentCategories', c),
    addCompany: async (c) => get().addListValue('companies', c),

    addDeal: async (d) => {
      const created = await pb.collection('v1_deals').create(d)
      set((s) => ({ deals: [...s.deals, created] as any }))
    },
    updateDeal: async (id, data) => {
      const updated = await pb.collection('v1_deals').update(id, data)
      set((s) => ({ deals: s.deals.map((d) => (d.id === id ? updated : d)) as any }))
    },
    removeDeal: async (id) => {
      await pb.collection('v1_deals').delete(id)
      set((s) => ({ deals: s.deals.filter((d) => d.id !== id) }))
    },

    addMentee: async (m) => {
      const created = await pb.collection('v1_mentees').create(m)
      set((s) => ({ mentees: [...s.mentees, { ...created, sessions: [] }] as any }))
    },
    updateMentee: async (id, data) => {
      const {
        id: _id,
        created,
        updated,
        expand,
        collectionId,
        collectionName,
        emailLogs,
        sessions,
        ...safeData
      } = data as any
      const updatedRecord = await pb.collection('v1_mentees').update(id, safeData)
      set((s) => ({
        mentees: s.mentees.map((m) => (m.id === id ? { ...m, ...updatedRecord } : m)) as any,
      }))
    },
    removeMentee: async (id) => {
      await pb.collection('v1_mentees').delete(id)
      set((s) => ({ mentees: s.mentees.filter((m) => m.id !== id) }))
    },
    addMenteeSession: async (mId, sess) => {
      const created = await pb.collection('v1_sessoes').create({ ...sess, mentee_id: mId })
      set((s) => ({
        mentees: s.mentees.map((m) =>
          m.id === mId ? { ...m, sessions: [...(m.sessions || []), created] } : m,
        ) as any,
      }))
    },
    updateMenteeSession: async (mId, sId, data) => {
      const { id, created, updated, expand, collectionId, collectionName, ...safeData } =
        data as any
      const updatedRecord = await pb.collection('v1_sessoes').update(sId, safeData)
      set((s) => ({
        mentees: s.mentees.map((m) =>
          m.id === mId
            ? { ...m, sessions: m.sessions.map((sess) => (sess.id === sId ? updatedRecord : sess)) }
            : m,
        ) as any,
      }))
    },
    removeMenteeSession: async (mId, sId) => {
      await pb.collection('v1_sessoes').delete(sId)
      set((s) => ({
        mentees: s.mentees.map((m) =>
          m.id === mId ? { ...m, sessions: m.sessions.filter((sess) => sess.id !== sId) } : m,
        ) as any,
      }))
    },
    addMenteeEmailLog: async (mId, log) => {
      const m = get().mentees.find((x) => x.id === mId)
      if (m) {
        const updatedLogs = [...(m.emailLogs || []), log]
        const updated = await pb.collection('v1_mentees').update(mId, { emailLogs: updatedLogs })

        const newNotif = { ...log, menteeName: m.name, timestamp: log.date, channel: log.type }
        const allNotifs = [...(get().notificationLogs || []), newNotif]
        await updateSettingsData({ notificationLogs: allNotifs })

        set((s) => ({
          mentees: s.mentees.map((x) =>
            x.id === mId ? { ...x, emailLogs: updatedLogs } : x,
          ) as any,
          notificationLogs: allNotifs,
        }))
      }
    },

    addTimeSlot: async (slot) => {
      const created = await pb.collection('v1_time_slots').create(slot)
      set((s) => ({ timeSlots: [...s.timeSlots, created] as any }))
    },
    updateTimeSlot: async (id, data) => {
      const {
        id: _id,
        created,
        updated,
        expand,
        collectionId,
        collectionName,
        ...safeData
      } = data as any
      const updatedRecord = await pb.collection('v1_time_slots').update(id, safeData)
      set((s) => ({
        timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, ...updatedRecord } : t)) as any,
      }))
    },
    removeTimeSlot: async (id) => {
      await pb.collection('v1_time_slots').delete(id)
      set((s) => ({ timeSlots: s.timeSlots.filter((t) => t.id !== id) }))
    },
    bookTimeSlot: async (id, name, email, phone, topic) => {
      const slot = get().timeSlots.find((t) => t.id === id)
      if (!slot) throw new Error('Slot not found')

      const cleanDate = slot.date?.split('T')[0] || ''
      const data_horario = new Date(`${cleanDate}T${slot.time}:00`).toISOString()

      try {
        const agendamentoData: any = {
          data_horario,
          cliente_nome: name,
          cliente_email: email,
          cliente_telefone: phone,
          status: 'pendente',
        }
        if (slot.service) agendamentoData.servico_id = slot.service
        if (slot.professional) agendamentoData.profissional_id = slot.professional

        const createdAgendamento = await pb.collection('v1_agendamentos').create(agendamentoData)

        const updatedSlot = await pb.collection('v1_time_slots').update(id, {
          isBooked: true,
          menteeName: name,
          menteeEmail: email,
          menteePhone: phone,
          description: topic,
        })

        set((s) => ({
          timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, ...updatedSlot } : t)) as any,
          agendamentos: [...s.agendamentos, createdAgendamento] as any,
        }))
      } catch (err) {
        console.error('Falha na operação de bookTimeSlot', err)
        throw err
      }
    },
    unbookTimeSlot: async (id) => {
      const updated = await pb.collection('v1_time_slots').update(id, {
        isBooked: false,
        menteeName: null,
        menteeEmail: null,
        menteePhone: null,
        description: null,
      })
      set((s) => ({
        timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, ...updated } : t)) as any,
      }))
    },

    addTransaction: async (tx) => {
      const created = await pb.collection('v1_transactions').create(tx)
      set((s) => ({ transactions: [...s.transactions, created] as any }))
    },
    addTransactions: async (txs) => {
      const created = await Promise.all(txs.map((t) => pb.collection('v1_transactions').create(t)))
      set((s) => ({ transactions: [...s.transactions, ...created] as any }))
    },
    updateTransaction: async (id, data) => {
      const {
        id: _id,
        created,
        updated,
        expand,
        collectionId,
        collectionName,
        ...safeData
      } = data as any
      const updatedRecord = await pb.collection('v1_transactions').update(id, safeData)
      set((s) => ({
        transactions: s.transactions.map((t) => (t.id === id ? updatedRecord : t)) as any,
      }))
    },
    removeTransaction: async (id) => {
      await pb.collection('v1_transactions').delete(id)
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
    },

    addClient: async (c) => {
      const created = await pb.collection('v1_clientes').create(c)
      set((s) => ({ clients: [...s.clients, created] as any }))
    },
    updateClient: async (id, data) => {
      const {
        id: _id,
        created,
        updated,
        expand,
        collectionId,
        collectionName,
        sessions,
        ...safeData
      } = data as any
      const updatedRecord = await pb.collection('v1_clientes').update(id, safeData)
      set((s) => ({ clients: s.clients.map((c) => (c.id === id ? updatedRecord : c)) as any }))
    },
    removeClient: async (id) => {
      await pb.collection('v1_clientes').delete(id)
      set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
    },
    addClientSession: async (sess) => {
      const created = await pb
        .collection('v1_sessoes')
        .create({ ...sess, client_id: sess.clientId })
      set((s) => ({ clientSessions: [...s.clientSessions, created] as any }))
    },
    updateClientSession: async (id, data) => {
      const {
        id: _id,
        created,
        updated,
        expand,
        collectionId,
        collectionName,
        ...safeData
      } = data as any
      const updatedRecord = await pb.collection('v1_sessoes').update(id, safeData)
      set((s) => ({
        clientSessions: s.clientSessions.map((c) => (c.id === id ? updatedRecord : c)) as any,
      }))
    },
    removeClientSession: async (id) => {
      await pb.collection('v1_sessoes').delete(id)
      set((s) => ({ clientSessions: s.clientSessions.filter((c) => c.id !== id) }))
    },

    addProposal: async (p) => {
      const created = await pb.collection('v1_proposals').create(p)
      set((s) => ({ proposals: [...s.proposals, created] as any }))
    },
    updateProposal: async (id, data) => {
      const updated = await pb.collection('v1_proposals').update(id, data)
      set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? updated : p)) as any }))
    },
    removeProposal: async (id) => {
      await pb.collection('v1_proposals').delete(id)
      set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) }))
    },

    setSystemSettings: async (data) => {
      const newVal = { ...get().systemSettings, ...data }
      await updateSettingsData({ systemSettings: newVal })
      set({ systemSettings: newVal })
    },
    setAnnualRevenueTarget: async (target) => {
      await updateSettingsData({ annualRevenueTarget: target })
      set({ annualRevenueTarget: target })
    },
    setFinancialForecasts: async (forecasts) => {
      const records = await pb.collection('forecasts_store').getFullList()
      if (records.length > 0) {
        await pb.collection('forecasts_store').update(records[0].id, { data: forecasts })
      } else {
        await pb.collection('forecasts_store').create({ data: forecasts })
      }
      set({ financialForecasts: forecasts })
    },
    setMessageTemplates: async (templates) => {
      await updateSettingsData({ messageTemplates: templates })
      set({ messageTemplates: templates })
    },
    setSessionReminderConfig: async (config) => {
      await updateSettingsData({ sessionReminderConfig: config })
      set({ sessionReminderConfig: config })
    },
  }
})
