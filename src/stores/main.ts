import React, { createContext, useContext, useState } from 'react'
import {
  Transaction,
  Lead,
  Mentee,
  Client,
  Session,
  TimeSlot,
  Interaction,
  EmailConfig,
  AutomationConfig,
  EmailLog,
} from '@/lib/types'
import {
  mockTransactions,
  mockLeads,
  mockMentees,
  mockClients,
  mockTimeSlots,
} from '@/lib/mockData'

interface MainState {
  company: string
  companies: string[]
  banks: string[]
  services: string[]
  suppliers: string[]
  expenseCategories: string[]
  paymentMethods: string[]
  transactions: Transaction[]
  leads: Lead[]
  mentees: Mentee[]
  clients: Client[]
  timeSlots: TimeSlot[]
  revenueGoal: number

  adminAuth: {
    isAuthenticated: boolean
  }
  menteeAuth: {
    isAuthenticated: boolean
    menteeId: string | null
  }
  emailConfig: EmailConfig
  automationConfig: AutomationConfig
}

interface MainContextType extends MainState {
  setCompany: (c: string) => void
  addTransaction: (t: Transaction) => void
  addTransactions: (t: Transaction[]) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  updateTransactionGroup: (groupId: string, fromDate: string, updates: Partial<Transaction>) => void
  removeTransaction: (id: string) => void

  updateLead: (id: string, updates: Partial<Lead>) => void
  removeLead: (id: string) => void

  addMenteeSession: (menteeId: string, session: Session) => void
  updateMenteeSession: (menteeId: string, sessionId: string, updates: Partial<Session>) => void
  removeMenteeSession: (menteeId: string, sessionId: string) => void
  updateMentee: (id: string, updates: Partial<Mentee>) => void
  removeMentee: (id: string) => void
  addMenteeEmailLog: (menteeId: string, log: EmailLog) => void

  addClient: (c: Client) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  removeClient: (id: string) => void
  addClientInteraction: (clientId: string, interaction: Interaction) => void

  addTimeSlot: (ts: TimeSlot) => void
  removeTimeSlot: (id: string) => void
  bookTimeSlot: (id: string, name: string, email: string, company: string) => void
  unbookTimeSlot: (id: string) => void

  addCompany: (c: string) => void
  removeCompany: (c: string) => void
  addBank: (b: string) => void
  removeBank: (b: string) => void
  addService: (s: string) => void
  removeService: (s: string) => void
  addSupplier: (s: string) => void
  removeSupplier: (s: string) => void
  addExpenseCategory: (c: string) => void
  removeExpenseCategory: (c: string) => void
  setRevenueGoal: (v: number) => void

  loginAdmin: (email: string, pass: string) => boolean
  logoutAdmin: () => void

  loginMentee: (email: string) => boolean
  logoutMentee: () => void
  setEmailConfig: (config: EmailConfig) => void
  setAutomationConfig: (config: AutomationConfig) => void
}

const defaultCompanies = ['Grupo Flávio Moura', 'FM Academy', 'FM Consultoria']
const defaultBanks = ['Banco Itaú', 'Banco Nubank']
const defaultServices = ['Consultoria', 'Mentoria', 'Software', 'Marketing']
const defaultSuppliers = ['Amazon AWS', 'Google Workspace', 'Facebook Ads', 'Escritório Contábil']
const defaultExpenseCategories = ['Software', 'Marketing', 'Infraestrutura', 'Impostos', 'Outros']
const defaultPaymentMethods = ['PIX', 'Cartão de Crédito', 'Boleto', 'Transferência Bancária']

const MainContext = createContext<MainContextType | null>(null)

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MainState>({
    company: 'Todas',
    companies: defaultCompanies,
    banks: defaultBanks,
    services: defaultServices,
    suppliers: defaultSuppliers,
    expenseCategories: defaultExpenseCategories,
    paymentMethods: defaultPaymentMethods,
    transactions: mockTransactions,
    leads: mockLeads,
    mentees: mockMentees,
    clients: mockClients,
    timeSlots: mockTimeSlots,
    revenueGoal: 20000,
    adminAuth: {
      isAuthenticated: false,
    },
    menteeAuth: {
      isAuthenticated: false,
      menteeId: null,
    },
    emailConfig: {
      provider: '',
      apiKey: '',
      senderEmail: 'contato@flaviomoura.com.br',
      senderName: 'Flávio Moura',
    },
    automationConfig: {
      sendSlipOnGeneration: true,
      sendReminder: true,
      reminderDaysBefore: 1,
      sendOverdue: true,
    },
  })

  const setCompany = (company: string) => setState((s) => ({ ...s, company }))
  const setRevenueGoal = (revenueGoal: number) => setState((s) => ({ ...s, revenueGoal }))

  const addTransaction = (t: Transaction) =>
    setState((s) => ({ ...s, transactions: [...s.transactions, t] }))
  const addTransactions = (t: Transaction[]) =>
    setState((s) => ({ ...s, transactions: [...s.transactions, ...t] }))
  const updateTransaction = (id: string, updates: Partial<Transaction>) =>
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))

  const updateTransactionGroup = (
    groupId: string,
    fromDate: string,
    updates: Partial<Transaction>,
  ) =>
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => {
        if (
          t.recurringGroupId === groupId &&
          new Date(t.date || 0).getTime() >= new Date(fromDate || 0).getTime()
        ) {
          return {
            ...t,
            ...updates,
            id: t.id,
            date: t.date,
            entryDate: t.entryDate,
            recurrence: t.recurrence,
            recurringGroupId: t.recurringGroupId,
          }
        }
        return t
      }),
    }))

  const removeTransaction = (id: string) =>
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))

  const updateLead = (id: string, updates: Partial<Lead>) =>
    setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)) }))
  const removeLead = (id: string) =>
    setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }))

  const addMenteeSession = (menteeId: string, session: Session) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, sessions: [...(m.sessions || []), session] } : m,
      ),
    }))

  const updateMenteeSession = (menteeId: string, sessionId: string, updates: Partial<Session>) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId
          ? {
              ...m,
              sessions: (m.sessions || []).map((sess) =>
                sess.id === sessionId ? { ...sess, ...updates } : sess,
              ),
            }
          : m,
      ),
    }))

  const removeMenteeSession = (menteeId: string, sessionId: string) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId
          ? {
              ...m,
              sessions: (m.sessions || []).filter((sess) => sess.id !== sessionId),
            }
          : m,
      ),
    }))

  const updateMentee = (id: string, updates: Partial<Mentee>) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))

  const removeMentee = (id: string) =>
    setState((s) => {
      const menteeToDelete = s.mentees.find((m) => m.id === id)
      const emailToUnbook = menteeToDelete?.email?.toLowerCase()

      return {
        ...s,
        mentees: s.mentees.filter((m) => m.id !== id),
        timeSlots: s.timeSlots.map((t) =>
          t.isBooked && emailToUnbook && t.menteeEmail?.toLowerCase() === emailToUnbook
            ? {
                ...t,
                isBooked: false,
                menteeName: undefined,
                menteeEmail: undefined,
                menteeCompany: undefined,
              }
            : t,
        ),
      }
    })

  const addMenteeEmailLog = (menteeId: string, log: EmailLog) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, emailLogs: [log, ...(m.emailLogs || [])] } : m,
      ),
    }))

  const addClient = (c: Client) => setState((s) => ({ ...s, clients: [...s.clients, c] }))
  const updateClient = (id: string, updates: Partial<Client>) =>
    setState((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  const removeClient = (id: string) =>
    setState((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }))

  const addClientInteraction = (clientId: string, interaction: Interaction) =>
    setState((s) => ({
      ...s,
      clients: s.clients.map((c) =>
        c.id === clientId ? { ...c, interactions: [...(c.interactions || []), interaction] } : c,
      ),
    }))

  const addTimeSlot = (ts: TimeSlot) => setState((s) => ({ ...s, timeSlots: [...s.timeSlots, ts] }))
  const removeTimeSlot = (id: string) =>
    setState((s) => ({ ...s, timeSlots: s.timeSlots.filter((t) => t.id !== id) }))
  const bookTimeSlot = (id: string, name: string, email: string, company: string) =>
    setState((s) => ({
      ...s,
      timeSlots: s.timeSlots.map((t) =>
        t.id === id
          ? { ...t, isBooked: true, menteeName: name, menteeEmail: email, menteeCompany: company }
          : t,
      ),
    }))

  const unbookTimeSlot = (id: string) =>
    setState((s) => ({
      ...s,
      timeSlots: s.timeSlots.map((t) =>
        t.id === id
          ? {
              ...t,
              isBooked: false,
              menteeName: undefined,
              menteeEmail: undefined,
              menteeCompany: undefined,
            }
          : t,
      ),
    }))

  const addCompany = (c: string) => setState((s) => ({ ...s, companies: [...s.companies, c] }))
  const removeCompany = (c: string) =>
    setState((s) => ({ ...s, companies: s.companies.filter((x) => x !== c) }))
  const addBank = (b: string) => setState((s) => ({ ...s, banks: [...s.banks, b] }))
  const removeBank = (b: string) =>
    setState((s) => ({ ...s, banks: s.banks.filter((x) => x !== b) }))
  const addService = (srv: string) => setState((s) => ({ ...s, services: [...s.services, srv] }))
  const removeService = (srv: string) =>
    setState((s) => ({ ...s, services: s.services.filter((x) => x !== srv) }))
  const addSupplier = (sup: string) => setState((s) => ({ ...s, suppliers: [...s.suppliers, sup] }))
  const removeSupplier = (sup: string) =>
    setState((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x !== sup) }))
  const addExpenseCategory = (cat: string) =>
    setState((s) => ({ ...s, expenseCategories: [...s.expenseCategories, cat] }))
  const removeExpenseCategory = (cat: string) =>
    setState((s) => ({ ...s, expenseCategories: s.expenseCategories.filter((x) => x !== cat) }))

  const loginAdmin = (email: string, pass: string) => {
    if (email === 'admin@flaviomoura.com.br' && pass === 'admin123') {
      setState((s) => ({ ...s, adminAuth: { isAuthenticated: true } }))
      return true
    }
    return false
  }

  const logoutAdmin = () => {
    setState((s) => ({ ...s, adminAuth: { isAuthenticated: false } }))
  }

  const loginMentee = (email: string) => {
    const mentee = state.mentees.find((m) => m.email?.toLowerCase() === email.toLowerCase())
    if (mentee) {
      setState((s) => ({ ...s, menteeAuth: { isAuthenticated: true, menteeId: mentee.id } }))
      return true
    }
    return false
  }
  const logoutMentee = () =>
    setState((s) => ({ ...s, menteeAuth: { isAuthenticated: false, menteeId: null } }))

  const setEmailConfig = (config: EmailConfig) => setState((s) => ({ ...s, emailConfig: config }))
  const setAutomationConfig = (config: AutomationConfig) =>
    setState((s) => ({ ...s, automationConfig: config }))

  const value = React.useMemo(
    () => ({
      ...state,
      setCompany,
      setRevenueGoal,
      addTransaction,
      addTransactions,
      updateTransaction,
      updateTransactionGroup,
      removeTransaction,
      updateLead,
      removeLead,
      addMenteeSession,
      updateMenteeSession,
      removeMenteeSession,
      updateMentee,
      removeMentee,
      addMenteeEmailLog,
      addClient,
      updateClient,
      removeClient,
      addClientInteraction,
      addTimeSlot,
      removeTimeSlot,
      bookTimeSlot,
      unbookTimeSlot,
      addCompany,
      removeCompany,
      addBank,
      removeBank,
      addService,
      removeService,
      addSupplier,
      removeSupplier,
      addExpenseCategory,
      removeExpenseCategory,
      loginAdmin,
      logoutAdmin,
      loginMentee,
      logoutMentee,
      setEmailConfig,
      setAutomationConfig,
    }),
    [state],
  )

  return React.createElement(MainContext.Provider, { value }, children)
}

export function useMainStore() {
  const context = useContext(MainContext)
  if (!context) throw new Error('useMainStore must be used within MainProvider')
  return context
}
