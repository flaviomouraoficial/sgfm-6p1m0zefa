import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { toast } from '@/hooks/use-toast'
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
  SessionReminderConfig,
  MessageTemplates,
  NotificationLog,
} from '@/lib/types'
import {
  mockTransactions,
  mockLeads,
  mockMentees,
  mockClients,
  mockTimeSlots,
  mockTemplates,
  mockNotificationLogs,
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
  sessionReminderConfig: SessionReminderConfig
  messageTemplates: MessageTemplates
  notificationLogs: NotificationLog[]
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
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void
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
  setSessionReminderConfig: (config: SessionReminderConfig) => void
  setMessageTemplates: (templates: MessageTemplates) => void
  addNotificationLog: (log: NotificationLog) => void

  refreshState: () => void
  isSyncing: boolean
  isInitialLoad: boolean
  syncData: () => Promise<void>
}

const defaultCompanies = ['Grupo Flávio Moura', 'FM Academy', 'FM Consultoria']
const defaultBanks = ['Banco Itaú', 'Banco Nubank']
const defaultServices = ['Consultoria', 'Mentoria', 'Software', 'Marketing']
const defaultSuppliers = ['Amazon AWS', 'Google Workspace', 'Facebook Ads', 'Escritório Contábil']
const defaultExpenseCategories = ['Software', 'Marketing', 'Infraestrutura', 'Impostos', 'Outros']
const defaultPaymentMethods = ['PIX', 'Cartão de Crédito', 'Boleto', 'Transferência Bancária']

const initialState: MainState = {
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
  sessionReminderConfig: {
    enabled: false,
    hoursBefore: 24,
    channels: {
      email: true,
      whatsapp: false,
    },
  },
  messageTemplates: mockTemplates,
  notificationLogs: mockNotificationLogs,
}

const loadState = (): MainState => {
  try {
    const saved = localStorage.getItem('sgfm_main_state')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...initialState,
        ...parsed,
        sessionReminderConfig: parsed.sessionReminderConfig || initialState.sessionReminderConfig,
        messageTemplates: parsed.messageTemplates || initialState.messageTemplates,
        notificationLogs: parsed.notificationLogs || initialState.notificationLogs,
      }
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e)
  }
  return initialState
}

const MainContext = createContext<MainContextType | null>(null)

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MainState>(loadState)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const isSyncingRef = useRef(false)

  const updateState = (updater: (s: MainState) => MainState) => {
    setState((s) => {
      const next = updater(s)
      try {
        localStorage.setItem('sgfm_main_state', JSON.stringify(next))
      } catch (err) {
        console.error('Error saving sync state:', err)
      }
      return next
    })
  }

  const syncData = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      // Simulate network request for real-time synchronization
      await new Promise((resolve) => setTimeout(resolve, 600))

      const saved = localStorage.getItem('sgfm_main_state')
      if (saved) {
        setState((prev) => {
          const parsed = JSON.parse(saved)
          if (JSON.stringify(prev) === JSON.stringify({ ...prev, ...parsed })) {
            return prev
          }
          return {
            ...prev,
            ...parsed,
          }
        })
      }
    } catch (e) {
      console.error('Error syncing state:', e)
      toast({
        title: 'Falha de Sincronização',
        description: 'Não foi possível atualizar os dados. Tentaremos novamente.',
        variant: 'destructive',
      })
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const doSync = async () => {
      await syncData()
      if (mounted) {
        setIsInitialLoad(false)
      }
    }

    doSync()

    const interval = setInterval(() => {
      syncData()
    }, 30000)

    const handleFocus = () => {
      syncData()
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sgfm_main_state' && e.newValue) {
        syncData()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)

    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
    }
  }, [syncData])

  const refreshState = useCallback(() => {
    try {
      const saved = localStorage.getItem('sgfm_main_state')
      if (saved) {
        setState((prev) => ({
          ...prev,
          ...JSON.parse(saved),
        }))
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e)
    }
  }, [])

  const setCompany = (company: string) => updateState((s) => ({ ...s, company }))
  const setRevenueGoal = (revenueGoal: number) => updateState((s) => ({ ...s, revenueGoal }))

  const addTransaction = (t: Transaction) =>
    updateState((s) => ({ ...s, transactions: [...s.transactions, t] }))
  const addTransactions = (t: Transaction[]) =>
    updateState((s) => ({ ...s, transactions: [...s.transactions, ...t] }))
  const updateTransaction = (id: string, updates: Partial<Transaction>) =>
    updateState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))

  const updateTransactionGroup = (
    groupId: string,
    fromDate: string,
    updates: Partial<Transaction>,
  ) =>
    updateState((s) => ({
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
    updateState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))

  const updateLead = (id: string, updates: Partial<Lead>) =>
    updateState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }))
  const removeLead = (id: string) =>
    updateState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }))

  const addMenteeSession = (menteeId: string, session: Session) =>
    updateState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, sessions: [...(m.sessions || []), session] } : m,
      ),
    }))

  const updateMenteeSession = (menteeId: string, sessionId: string, updates: Partial<Session>) =>
    updateState((s) => ({
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
    updateState((s) => ({
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
    updateState((s) => ({
      ...s,
      mentees: s.mentees.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))

  const removeMentee = (id: string) =>
    updateState((s) => {
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
    updateState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, emailLogs: [log, ...(m.emailLogs || [])] } : m,
      ),
    }))

  const addClient = (c: Client) => updateState((s) => ({ ...s, clients: [...s.clients, c] }))
  const updateClient = (id: string, updates: Partial<Client>) =>
    updateState((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  const removeClient = (id: string) =>
    updateState((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }))

  const addClientInteraction = (clientId: string, interaction: Interaction) =>
    updateState((s) => ({
      ...s,
      clients: s.clients.map((c) =>
        c.id === clientId ? { ...c, interactions: [...(c.interactions || []), interaction] } : c,
      ),
    }))

  const addTimeSlot = (ts: TimeSlot) =>
    updateState((s) => ({ ...s, timeSlots: [...s.timeSlots, ts] }))
  const updateTimeSlot = (id: string, updates: Partial<TimeSlot>) =>
    updateState((s) => ({
      ...s,
      timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  const removeTimeSlot = (id: string) =>
    updateState((s) => ({ ...s, timeSlots: s.timeSlots.filter((t) => t.id !== id) }))
  const bookTimeSlot = (id: string, name: string, email: string, company: string) =>
    updateState((s) => ({
      ...s,
      timeSlots: s.timeSlots.map((t) =>
        t.id === id
          ? { ...t, isBooked: true, menteeName: name, menteeEmail: email, menteeCompany: company }
          : t,
      ),
    }))

  const unbookTimeSlot = (id: string) =>
    updateState((s) => ({
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

  const addCompany = (c: string) => updateState((s) => ({ ...s, companies: [...s.companies, c] }))
  const removeCompany = (c: string) =>
    updateState((s) => ({ ...s, companies: s.companies.filter((x) => x !== c) }))
  const addBank = (b: string) => updateState((s) => ({ ...s, banks: [...s.banks, b] }))
  const removeBank = (b: string) =>
    updateState((s) => ({ ...s, banks: s.banks.filter((x) => x !== b) }))
  const addService = (srv: string) => updateState((s) => ({ ...s, services: [...s.services, srv] }))
  const removeService = (srv: string) =>
    updateState((s) => ({ ...s, services: s.services.filter((x) => x !== srv) }))
  const addSupplier = (sup: string) =>
    updateState((s) => ({ ...s, suppliers: [...s.suppliers, sup] }))
  const removeSupplier = (sup: string) =>
    updateState((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x !== sup) }))
  const addExpenseCategory = (cat: string) =>
    updateState((s) => ({ ...s, expenseCategories: [...s.expenseCategories, cat] }))
  const removeExpenseCategory = (cat: string) =>
    updateState((s) => ({ ...s, expenseCategories: s.expenseCategories.filter((x) => x !== cat) }))

  const loginAdmin = (email: string, pass: string) => {
    if (email === 'admin@flaviomoura.com.br' && pass === 'admin123') {
      updateState((s) => ({ ...s, adminAuth: { isAuthenticated: true } }))
      return true
    }
    return false
  }

  const logoutAdmin = () => {
    updateState((s) => ({ ...s, adminAuth: { isAuthenticated: false } }))
  }

  const loginMentee = (email: string) => {
    const mentee = state.mentees.find((m) => m.email?.toLowerCase() === email.toLowerCase())
    if (mentee) {
      updateState((s) => ({ ...s, menteeAuth: { isAuthenticated: true, menteeId: mentee.id } }))
      return true
    }
    return false
  }
  const logoutMentee = () =>
    updateState((s) => ({ ...s, menteeAuth: { isAuthenticated: false, menteeId: null } }))

  const setEmailConfig = (config: EmailConfig) =>
    updateState((s) => ({ ...s, emailConfig: config }))
  const setAutomationConfig = (config: AutomationConfig) =>
    updateState((s) => ({ ...s, automationConfig: config }))
  const setSessionReminderConfig = (config: SessionReminderConfig) =>
    updateState((s) => ({ ...s, sessionReminderConfig: config }))

  const setMessageTemplates = (templates: MessageTemplates) =>
    updateState((s) => ({ ...s, messageTemplates: templates }))

  const addNotificationLog = (log: NotificationLog) =>
    updateState((s) => ({ ...s, notificationLogs: [log, ...s.notificationLogs] }))

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
      updateTimeSlot,
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
      setSessionReminderConfig,
      setMessageTemplates,
      addNotificationLog,
      refreshState,
      isSyncing,
      isInitialLoad,
      syncData,
    }),
    [state, refreshState, syncData, isSyncing, isInitialLoad],
  )

  return React.createElement(MainContext.Provider, { value }, children)
}

export function useMainStore() {
  const context = useContext(MainContext)
  if (!context) throw new Error('useMainStore must be used within MainProvider')
  return context
}
