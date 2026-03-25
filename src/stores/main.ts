import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
} from '@/lib/types'
import { cloudApi } from '@/lib/cloudApi'

export interface FinancialForecast {
  month: string
  expectedIncome: number
  expectedExpense: number
}

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'gfm-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    },
  ),
)

interface MainState {
  currentPath: string
  setCurrentPath: (p: string) => void

  deals: Deal[]
  mentees: Mentee[]
  timeSlots: TimeSlot[]
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

  menteeAuth: { isAuthenticated: boolean; menteeId: string | null }
  loginMentee: (email: string) => boolean
  logoutMentee: () => void

  syncData: () => Promise<void>
  syncPublicData: () => Promise<void>

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

  addTimeSlot: (slot: TimeSlot) => Promise<void>
  updateTimeSlot: (id: string, data: Partial<TimeSlot>) => Promise<void>
  removeTimeSlot: (id: string) => Promise<void>
  bookTimeSlot: (
    id: string,
    name: string,
    email: string,
    phone: string,
    topic: string,
    servicoId?: string,
    profissionalId?: string,
  ) => Promise<void>
  unbookTimeSlot: (id: string) => Promise<void>

  addTransaction: (tx: Transaction) => Promise<void>
  addTransactions: (txs: Transaction[]) => Promise<void>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  updateTransactionGroup: (
    groupId: string,
    fromDate: string,
    data: Partial<Transaction>,
  ) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
  removeTransactionGroup: (groupId: string, fromDate: string) => Promise<void>

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

const getMenteeAuth = () => {
  try {
    return (
      JSON.parse(localStorage.getItem('gfm_mentee_auth') as string) || {
        isAuthenticated: false,
        menteeId: null,
      }
    )
  } catch (e) {
    return { isAuthenticated: false, menteeId: null }
  }
}

export const useMainStore = create<MainState>()((set, get) => ({
  currentPath: '/admin',
  setCurrentPath: (p) => set({ currentPath: p }),

  deals: [],
  mentees: [],
  timeSlots: [],
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

  menteeAuth: getMenteeAuth(),
  loginMentee: (email) => {
    const m = get().mentees.find((x) => x.email === email)
    if (m) {
      const auth = { isAuthenticated: true, menteeId: m.id }
      localStorage.setItem('gfm_mentee_auth', JSON.stringify(auth))
      set({ menteeAuth: auth })
      return true
    }
    return false
  },
  logoutMentee: () => {
    const auth = { isAuthenticated: false, menteeId: null }
    localStorage.setItem('gfm_mentee_auth', JSON.stringify(auth))
    set({ menteeAuth: auth })
  },

  syncData: async () => {
    set({ isSyncing: true })
    try {
      const [
        deals,
        transactions,
        mentees,
        proposals,
        timeSlots,
        settings,
        forecasts,
        clients,
        clientSessions,
      ] = await Promise.all([
        cloudApi.deals.list(),
        cloudApi.transactions.list(),
        cloudApi.mentees.list(),
        cloudApi.proposals.list(),
        cloudApi.timeSlots.list(),
        cloudApi.settings.get(),
        cloudApi.forecasts.get(),
        cloudApi.clients.list(),
        cloudApi.sessions.list(),
      ])

      set({
        deals,
        transactions,
        mentees,
        proposals,
        timeSlots,
        clients,
        clientSessions,
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
      set({ isSyncing: false, isInitialLoad: false })
    }
  },

  syncPublicData: async () => {
    set({ isSyncing: true, publicDataError: null })
    try {
      const [timeSlots, settings, servicos, profissionais] = await Promise.all([
        cloudApi.timeSlots.list(),
        cloudApi.settings.get(),
        cloudApi.servicos.list(),
        cloudApi.profissionais.list(),
      ])

      set({
        timeSlots,
        systemSettings: settings.systemSettings || get().systemSettings,
        services: settings.services || [],
        companies: settings.companies || [],
        servicos,
        profissionais,
        isSyncing: false,
        isPublicDataLoaded: true,
        publicDataError: null,
      })
    } catch (e: any) {
      set({
        isSyncing: false,
        isPublicDataLoaded: true, // Mark loaded so UI stops spinning and shows error instead
        publicDataError: e.message || 'Falha ao carregar dados do agendamento.',
      })
    }
  },

  addListValue: async (listKey, value) => {
    const state = get() as any
    const currentList = state[listKey] || []
    const newList = Array.from(new Set([...currentList, value]))
    const settings = await cloudApi.settings.get()
    await cloudApi.settings.save({ ...settings, [listKey]: newList })
    set({ [listKey]: newList })
  },
  removeListValue: async (listKey, value) => {
    const state = get() as any
    const currentList = state[listKey] || []
    const newList = currentList.filter((item: string) => item !== value)
    const settings = await cloudApi.settings.get()
    await cloudApi.settings.save({ ...settings, [listKey]: newList })
    set({ [listKey]: newList })
  },

  addService: async (s) => get().addListValue('services', s),
  addExpenseCategory: async (c) => get().addListValue('expenseCategories', c),
  addInvestmentCategory: async (c) => get().addListValue('investmentCategories', c),
  addCompany: async (c) => get().addListValue('companies', c),

  addDeal: async (d) => {
    const created = await cloudApi.deals.create(d)
    set((s) => ({ deals: [...s.deals, created] }))
  },
  updateDeal: async (id, data) => {
    const updated = await cloudApi.deals.update(id, data)
    set((s) => ({ deals: s.deals.map((d) => (d.id === id ? updated : d)) }))
  },
  removeDeal: async (id) => {
    await cloudApi.deals.delete(id)
    set((s) => ({ deals: s.deals.filter((d) => d.id !== id) }))
  },

  addMentee: async (m) => {
    const created = await cloudApi.mentees.create(m)
    set((s) => ({ mentees: [...s.mentees, created] }))
  },
  updateMentee: async (id, data) => {
    const updated = await cloudApi.mentees.update(id, data)
    set((s) => ({ mentees: s.mentees.map((m) => (m.id === id ? updated : m)) }))
  },
  removeMentee: async (id) => {
    await cloudApi.mentees.delete(id)
    set((s) => ({ mentees: s.mentees.filter((m) => m.id !== id) }))
  },
  addMenteeSession: async (mId, sess) => {
    const m = get().mentees.find((x) => x.id === mId)
    if (m) {
      const updatedSessions = [...(m.sessions || []), sess]
      const updated = await cloudApi.mentees.update(mId, { sessions: updatedSessions })
      set((s) => ({ mentees: s.mentees.map((x) => (x.id === mId ? updated : x)) }))
    }
  },
  updateMenteeSession: async (mId, sId, data) => {
    const m = get().mentees.find((x) => x.id === mId)
    if (m) {
      const updatedSessions = m.sessions.map((s) => (s.id === sId ? { ...s, ...data } : s))
      const updated = await cloudApi.mentees.update(mId, { sessions: updatedSessions })
      set((s) => ({ mentees: s.mentees.map((x) => (x.id === mId ? updated : x)) }))
    }
  },
  removeMenteeSession: async (mId, sId) => {
    const m = get().mentees.find((x) => x.id === mId)
    if (m) {
      const updatedSessions = m.sessions.filter((s) => s.id !== sId)
      const updated = await cloudApi.mentees.update(mId, { sessions: updatedSessions })
      set((s) => ({ mentees: s.mentees.map((x) => (x.id === mId ? updated : x)) }))
    }
  },
  addMenteeEmailLog: async (mId, log) => {
    const m = get().mentees.find((x) => x.id === mId)
    if (m) {
      const updatedLogs = [...(m.emailLogs || []), log]
      const updated = await cloudApi.mentees.update(mId, { emailLogs: updatedLogs })
      const newNotif = { ...log, menteeName: m.name, timestamp: log.date, channel: log.type }
      const allSettings = await cloudApi.settings.get()
      const allNotifs = [...(allSettings.notificationLogs || []), newNotif]
      await cloudApi.settings.save({ ...allSettings, notificationLogs: allNotifs })
      set((s) => ({
        mentees: s.mentees.map((x) => (x.id === mId ? updated : x)),
        notificationLogs: allNotifs,
      }))
    }
  },

  addTimeSlot: async (slot) => {
    const created = await cloudApi.timeSlots.create(slot)
    set((s) => ({ timeSlots: [...s.timeSlots, created] }))
  },
  updateTimeSlot: async (id, data) => {
    const updated = await cloudApi.timeSlots.update(id, data)
    set((s) => ({ timeSlots: s.timeSlots.map((t) => (t.id === id ? updated : t)) }))
  },
  removeTimeSlot: async (id) => {
    await cloudApi.timeSlots.delete(id)
    set((s) => ({ timeSlots: s.timeSlots.filter((t) => t.id !== id) }))
  },
  bookTimeSlot: async (id, name, email, phone, topic, servicoId, profissionalId) => {
    const slot = get().timeSlots.find((t) => t.id === id)
    if (!slot) throw new Error('Slot not found')

    if (cloudApi.timeSlots.book) {
      await cloudApi.timeSlots.book({
        ...slot,
        cliente_nome: name,
        cliente_email: email,
        cliente_telefone: phone,
        servico_id: servicoId,
        profissional_id: profissionalId,
        data_agendamento: slot.date,
        horario: slot.time,
        status: 'pendente',
        menteeName: name, // Fallback for local UI display mapping
        menteeEmail: email, // Fallback for local UI display mapping
        menteePhone: phone, // Fallback for local UI display mapping
        description: topic, // Fallback for local UI display mapping
      })
    } else {
      await cloudApi.timeSlots.update(id, {
        isBooked: true,
        menteeName: name,
        menteeEmail: email,
        menteePhone: phone,
        description: topic,
      })
    }

    set((s) => ({
      timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, isBooked: true } : t)),
    }))
  },
  unbookTimeSlot: async (id) => {
    const updated = await cloudApi.timeSlots.update(id, {
      isBooked: false,
      menteeName: '',
      menteeEmail: '',
      menteePhone: '',
      description: '',
    })
    set((s) => ({ timeSlots: s.timeSlots.map((t) => (t.id === id ? updated : t)) }))
  },

  addTransaction: async (tx) => {
    const created = await cloudApi.transactions.create(tx)
    set((s) => ({ transactions: [...s.transactions, created] }))
  },
  addTransactions: async (txs) => {
    const created = await Promise.all(txs.map((t) => cloudApi.transactions.create(t)))
    set((s) => ({ transactions: [...s.transactions, ...created] }))
  },
  updateTransaction: async (id, data) => {
    const updated = await cloudApi.transactions.update(id, data)
    set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? updated : t)) }))
  },
  updateTransactionGroup: async (groupId, fromDate, data) => {
    const txsToUpdate = get().transactions.filter(
      (t) => t.recurringGroupId === groupId && new Date(t.date) >= new Date(fromDate),
    )
    const updated = await Promise.all(
      txsToUpdate.map((t) =>
        cloudApi.transactions.update(t.id, { ...data, id: t.id, date: t.date }),
      ),
    )
    set((s) => ({
      transactions: s.transactions.map((t) => updated.find((u) => u.id === t.id) || t),
    }))
  },
  removeTransaction: async (id) => {
    await cloudApi.transactions.delete(id)
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
  },
  removeTransactionGroup: async (groupId, fromDate) => {
    const txsToRemove = get().transactions.filter(
      (t) => t.recurringGroupId === groupId && new Date(t.date) >= new Date(fromDate),
    )
    await Promise.all(txsToRemove.map((t) => cloudApi.transactions.delete(t.id)))
    set((s) => ({
      transactions: s.transactions.filter(
        (t) => !(t.recurringGroupId === groupId && new Date(t.date) >= new Date(fromDate)),
      ),
    }))
  },

  addClient: async (c) => {
    const created = await cloudApi.clients.create(c)
    set((s) => ({ clients: [...s.clients, created] }))
  },
  updateClient: async (id, data) => {
    const updated = await cloudApi.clients.update(id, data)
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? updated : c)) }))
  },
  removeClient: async (id) => {
    await cloudApi.clients.delete(id)
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
  },
  addClientSession: async (session) => {
    const created = await cloudApi.sessions.create(session)
    set((s) => ({ clientSessions: [...s.clientSessions, created] }))
  },
  updateClientSession: async (id, data) => {
    const updated = await cloudApi.sessions.update(id, data)
    set((s) => ({ clientSessions: s.clientSessions.map((c) => (c.id === id ? updated : c)) }))
  },
  removeClientSession: async (id) => {
    await cloudApi.sessions.delete(id)
    set((s) => ({ clientSessions: s.clientSessions.filter((c) => c.id !== id) }))
  },

  addProposal: async (p) => {
    const created = await cloudApi.proposals.create(p)
    set((s) => ({ proposals: [...s.proposals, created] }))
  },
  updateProposal: async (id, data) => {
    const updated = await cloudApi.proposals.update(id, data)
    set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? updated : p)) }))
  },
  removeProposal: async (id) => {
    await cloudApi.proposals.delete(id)
    set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) }))
  },

  setSystemSettings: async (data) => {
    const newVal = { ...get().systemSettings, ...data }
    await cloudApi.settings.save({ ...(await cloudApi.settings.get()), systemSettings: newVal })
    set({ systemSettings: newVal })
  },
  setAnnualRevenueTarget: async (target) => {
    await cloudApi.settings.save({
      ...(await cloudApi.settings.get()),
      annualRevenueTarget: target,
    })
    set({ annualRevenueTarget: target })
  },
  setFinancialForecasts: async (forecasts) => {
    await cloudApi.forecasts.save(forecasts)
    set({ financialForecasts: forecasts })
  },
  setMessageTemplates: async (templates) => {
    await cloudApi.settings.save({
      ...(await cloudApi.settings.get()),
      messageTemplates: templates,
    })
    set({ messageTemplates: templates })
  },
  setSessionReminderConfig: async (config) => {
    await cloudApi.settings.save({
      ...(await cloudApi.settings.get()),
      sessionReminderConfig: config,
    })
    set({ sessionReminderConfig: config })
  },
}))
