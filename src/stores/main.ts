import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Mentee, TimeSlot, Transaction, Session, Proposal } from '@/lib/types'

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
    { name: 'gfm-auth' },
  ),
)

interface MainState {
  mentees: Mentee[]
  timeSlots: TimeSlot[]
  transactions: Transaction[]
  proposals: Proposal[]
  financialForecasts: FinancialForecast[]
  annualRevenueTarget: number
  systemSettings: {
    logo: string
    companyName: string
    contactPhone: string
    contactEmail: string
  }
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
  bookTimeSlot: (id: string, name: string, email: string, comp: string) => Promise<void>
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

  addProposal: (p: Proposal) => void
  updateProposal: (id: string, data: Partial<Proposal>) => void
  removeProposal: (id: string) => void
  setSystemSettings: (settings: Partial<MainState['systemSettings']>) => void
  setAnnualRevenueTarget: (t: number) => void
  setFinancialForecasts: (f: FinancialForecast[]) => void
}

const cy = new Date().getFullYear()
const mockTxs: Transaction[] = [
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
  {
    id: 't3',
    description: 'Consultoria Estratégica',
    amount: 8500,
    type: 'Receita',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    category: 'Serviços',
    status: 'Pendente',
  },
  {
    id: 't4',
    description: 'Impostos Mês Passado',
    amount: 3200,
    type: 'Despesa',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    category: 'Impostos',
    status: 'Pendente',
  },
]

export const useMainStore = create<MainState>()(
  persist(
    (set, get) => ({
      mentees: [],
      timeSlots: [],
      transactions: mockTxs,
      proposals: [
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
      ],
      financialForecasts: Array.from({ length: 12 }).map((_, i) => ({
        month: `${cy}-${String(i + 1).padStart(2, '0')}`,
        expectedIncome: 20000 + i * 2000,
        expectedExpense: 8000 + i * 500,
      })),
      annualRevenueTarget: 300000,
      systemSettings: {
        logo: '',
        companyName: 'Grupo Flávio Moura',
        contactPhone: '',
        contactEmail: '',
      },
      companies: ['Grupo Flávio Moura', 'Empresa Exemplo SA'],
      company: 'Todas',
      banks: ['Itaú', 'Bradesco', 'Nubank', 'Inter'],
      services: ['Mentoria', 'Consultoria', 'Palestra', 'Treinamento'],
      expenseCategories: ['Ferramentas', 'Impostos', 'Marketing', 'Salários', 'Infraestrutura'],
      paymentMethods: ['PIX', 'Cartão de Crédito', 'Boleto', 'Transferência'],
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
      isInitialLoad: false,
      isSyncing: false,

      syncData: async () => {
        set({ isSyncing: true })
        await new Promise((r) => setTimeout(r, 400))
        set({ isSyncing: false, isInitialLoad: false })
      },
      addMentee: (m) => set((s) => ({ mentees: [...s.mentees, m] })),
      updateMentee: (id, data) =>
        set((s) => ({ mentees: s.mentees.map((m) => (m.id === id ? { ...m, ...data } : m)) })),
      removeMentee: (id) => set((s) => ({ mentees: s.mentees.filter((m) => m.id !== id) })),
      addMenteeSession: (mId, sess) =>
        set((s) => ({
          mentees: s.mentees.map((m) =>
            m.id === mId ? { ...m, sessions: [...(m.sessions || []), sess] } : m,
          ),
        })),
      updateMenteeSession: (mId, sId, data) =>
        set((s) => ({
          mentees: s.mentees.map((m) =>
            m.id === mId
              ? {
                  ...m,
                  sessions: m.sessions.map((ss) => (ss.id === sId ? { ...ss, ...data } : ss)),
                }
              : m,
          ),
        })),
      removeMenteeSession: (mId, sId) =>
        set((s) => ({
          mentees: s.mentees.map((m) =>
            m.id === mId ? { ...m, sessions: m.sessions.filter((ss) => ss.id !== sId) } : m,
          ),
        })),

      addTimeSlot: (slot) => set((s) => ({ timeSlots: [...s.timeSlots, slot] })),
      updateTimeSlot: (id, data) =>
        set((s) => ({ timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
      removeTimeSlot: (id) => set((s) => ({ timeSlots: s.timeSlots.filter((t) => t.id !== id) })),
      bookTimeSlot: async (id, name, email, comp) =>
        set((s) => ({
          timeSlots: s.timeSlots.map((t) =>
            t.id === id
              ? { ...t, isBooked: true, menteeName: name, menteeEmail: email, menteeCompany: comp }
              : t,
          ),
        })),
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
          transactions: s.transactions.map((t) =>
            t.recurringGroupId === groupId && new Date(t.date) >= new Date(fromDate)
              ? { ...t, ...data, id: t.id, date: t.date }
              : t,
          ),
        })),
      removeTransaction: async (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      removeTransactionGroup: async (groupId, fromDate) =>
        set((s) => ({
          transactions: s.transactions.filter(
            (t) => !(t.recurringGroupId === groupId && new Date(t.date) >= new Date(fromDate)),
          ),
        })),

      addProposal: (p) => set((s) => ({ proposals: [...s.proposals, p] })),
      updateProposal: (id, data) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      removeProposal: (id) => set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) })),
      setSystemSettings: (data) =>
        set((s) => ({ systemSettings: { ...(s.systemSettings || {}), ...data } })),
      setAnnualRevenueTarget: (target) => set({ annualRevenueTarget: target }),
      setFinancialForecasts: (forecasts) => set({ financialForecasts: forecasts }),
    }),
    { name: 'gfm-main-store' },
  ),
)
