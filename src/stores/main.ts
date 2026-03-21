import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Mentee, TimeSlot, Transaction, Session } from '@/lib/types'

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
    { name: 'gfm-auth' },
  ),
)

interface MainState {
  mentees: Mentee[]
  timeSlots: TimeSlot[]
  transactions: Transaction[]
  companies: string[]
  company: string
  banks: string[]
  services: string[]
  expenseCategories: string[]
  paymentMethods: string[]
  emailConfig: any
  sessionReminderConfig: any
  messageTemplates: any
  notificationLogs: any[]
  isInitialLoad: boolean
  isSyncing: boolean
  menteeAuth: { isAuthenticated: boolean; menteeId: string | null }

  syncData: () => Promise<void>
  addMentee: (m: Mentee) => void
  updateMentee: (id: string, data: Partial<Mentee>) => void
  removeMentee: (id: string) => void
  addMenteeSession: (menteeId: string, session: Session) => void
  updateMenteeSession: (menteeId: string, sessionId: string, data: Partial<Session>) => void
  removeMenteeSession: (menteeId: string, sessionId: string) => void

  addTimeSlot: (slot: TimeSlot) => void
  updateTimeSlot: (id: string, data: Partial<TimeSlot>) => void
  removeTimeSlot: (id: string) => void
  bookTimeSlot: (id: string, name: string, email: string, company: string) => Promise<void>
  unbookTimeSlot: (id: string) => void

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

  addMenteeEmailLog: (menteeId: string, log: any) => void
  loginMentee: (email: string) => boolean
  logoutMentee: () => void
  setSessionReminderConfig: (config: any) => void
  setMessageTemplates: (templates: any) => void
}

export const useMainStore = create<MainState>()(
  persist(
    (set, get) => ({
      mentees: [],
      timeSlots: [],
      transactions: [],
      companies: ['Grupo Flávio Moura', 'Empresa Exemplo SA', 'Startup Inovadora'],
      company: 'Todas',
      banks: ['Itaú', 'Bradesco', 'Nubank', 'Inter', 'Caixa'],
      services: ['Mentoria', 'Consultoria', 'Palestra', 'Treinamento', 'Outros'],
      expenseCategories: [
        'Ferramentas/Software',
        'Impostos',
        'Marketing/Anúncios',
        'Salários',
        'Infraestrutura',
        'Outros',
      ],
      paymentMethods: ['PIX', 'Cartão de Crédito', 'Boleto', 'Transferência', 'Dinheiro'],
      emailConfig: { provider: 'Nenhum', apiKey: '' },
      sessionReminderConfig: {
        enabled: false,
        hoursBefore: 24,
        channels: { email: true, whatsapp: false },
      },
      messageTemplates: {
        emailSubject: 'Sua Mentoria com Flávio Moura',
        emailBody: 'Olá,\n\nEste é um lembrete.',
        whatsappBody: 'Olá, lembrete de mentoria!',
        defaultMeetingLink: 'https://meet.google.com',
      },
      notificationLogs: [],
      isInitialLoad: false,
      isSyncing: false,
      menteeAuth: { isAuthenticated: false, menteeId: null },

      syncData: async () => {
        set({ isSyncing: true })
        await new Promise((r) => setTimeout(r, 400))
        set({ isSyncing: false, isInitialLoad: false })
      },
      addMentee: (m) => set((s) => ({ mentees: [...s.mentees, m] })),
      updateMentee: (id, data) =>
        set((s) => ({ mentees: s.mentees.map((m) => (m.id === id ? { ...m, ...data } : m)) })),
      removeMentee: (id) => set((s) => ({ mentees: s.mentees.filter((m) => m.id !== id) })),

      addMenteeSession: (menteeId, session) =>
        set((s) => ({
          mentees: s.mentees.map((m) =>
            m.id === menteeId ? { ...m, sessions: [...(m.sessions || []), session] } : m,
          ),
        })),
      updateMenteeSession: (menteeId, sessionId, data) =>
        set((s) => ({
          mentees: s.mentees.map((m) =>
            m.id === menteeId
              ? {
                  ...m,
                  sessions: m.sessions.map((ss) => (ss.id === sessionId ? { ...ss, ...data } : ss)),
                }
              : m,
          ),
        })),
      removeMenteeSession: (menteeId, sessionId) =>
        set((s) => ({
          mentees: s.mentees.map((m) =>
            m.id === menteeId
              ? { ...m, sessions: m.sessions.filter((ss) => ss.id !== sessionId) }
              : m,
          ),
        })),

      addTimeSlot: (slot) => set((s) => ({ timeSlots: [...s.timeSlots, slot] })),
      updateTimeSlot: (id, data) =>
        set((s) => ({ timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
      removeTimeSlot: (id) => set((s) => ({ timeSlots: s.timeSlots.filter((t) => t.id !== id) })),
      bookTimeSlot: async (id, name, email, comp) => {
        set((s) => ({
          timeSlots: s.timeSlots.map((t) =>
            t.id === id
              ? { ...t, isBooked: true, menteeName: name, menteeEmail: email, menteeCompany: comp }
              : t,
          ),
        }))
      },
      unbookTimeSlot: (id) =>
        set((s) => ({
          timeSlots: s.timeSlots.map((t) =>
            t.id === id
              ? { ...t, isBooked: false, menteeName: '', menteeEmail: '', menteeCompany: '' }
              : t,
          ),
        })),

      addTransaction: async (tx) => set((s) => ({ transactions: [...s.transactions, tx] })),
      addTransactions: async (txs) => set((s) => ({ transactions: [...s.transactions, ...txs] })),
      updateTransaction: async (id, data) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      updateTransactionGroup: async (groupId, fromDate, data) =>
        set((s) => ({
          transactions: s.transactions.map((t) => {
            if (t.recurringGroupId === groupId && new Date(t.date) >= new Date(fromDate)) {
              return { ...t, ...data, id: t.id, date: t.date }
            }
            return t
          }),
        })),
      removeTransaction: async (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      removeTransactionGroup: async (groupId, fromDate) =>
        set((s) => ({
          transactions: s.transactions.filter(
            (t) => !(t.recurringGroupId === groupId && new Date(t.date) >= new Date(fromDate)),
          ),
        })),

      addMenteeEmailLog: (menteeId, log) =>
        set((s) => ({
          mentees: s.mentees.map((m) =>
            m.id === menteeId ? { ...m, emailLogs: [...(m.emailLogs || []), log] } : m,
          ),
        })),

      loginMentee: (email) => {
        const mentee = get().mentees.find((m) => m.email.toLowerCase() === email.toLowerCase())
        if (mentee) {
          set({ menteeAuth: { isAuthenticated: true, menteeId: mentee.id } })
          return true
        }
        return false
      },
      logoutMentee: () => set({ menteeAuth: { isAuthenticated: false, menteeId: null } }),
      setSessionReminderConfig: (config) => set({ sessionReminderConfig: config }),
      setMessageTemplates: (templates) => set({ messageTemplates: templates }),
    }),
    { name: 'gfm-main-store' },
  ),
)
