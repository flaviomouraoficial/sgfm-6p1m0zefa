import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
import { CloudAPI } from '@/lib/cloudApi'

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
  adminAuth: { isAuthenticated: boolean }
  menteeAuth: { isAuthenticated: boolean; menteeId: string | null }
  emailConfig: EmailConfig
  automationConfig: AutomationConfig
  sessionReminderConfig: SessionReminderConfig
  messageTemplates: MessageTemplates
  notificationLogs: NotificationLog[]
}

interface MainContextType extends MainState {
  setCompany: (c: string) => void
  addTransaction: (t: Transaction) => Promise<void>
  addTransactions: (t: Transaction[]) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  updateTransactionGroup: (
    groupId: string,
    fromDate: string,
    updates: Partial<Transaction>,
  ) => Promise<void>
  removeTransaction: (id: string) => Promise<void>

  addLead: (l: Lead) => Promise<void>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  removeLead: (id: string) => Promise<void>

  addMentee: (m: Mentee) => Promise<void>
  addMenteeSession: (menteeId: string, session: Session) => Promise<void>
  updateMenteeSession: (
    menteeId: string,
    sessionId: string,
    updates: Partial<Session>,
  ) => Promise<void>
  removeMenteeSession: (menteeId: string, sessionId: string) => Promise<void>
  updateMentee: (id: string, updates: Partial<Mentee>) => Promise<void>
  removeMentee: (id: string) => Promise<void>
  addMenteeEmailLog: (menteeId: string, log: EmailLog) => Promise<void>

  addClient: (c: Client) => Promise<void>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  removeClient: (id: string) => Promise<void>
  addClientInteraction: (clientId: string, interaction: Interaction) => Promise<void>

  addTimeSlot: (ts: TimeSlot) => Promise<void>
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => Promise<void>
  removeTimeSlot: (id: string) => Promise<void>
  bookTimeSlot: (id: string, name: string, email: string, company: string) => Promise<void>
  unbookTimeSlot: (id: string) => Promise<void>

  addCompany: (c: string) => Promise<void>
  removeCompany: (c: string) => Promise<void>
  addBank: (b: string) => Promise<void>
  removeBank: (b: string) => Promise<void>
  addService: (s: string) => Promise<void>
  removeService: (s: string) => Promise<void>
  addSupplier: (s: string) => Promise<void>
  removeSupplier: (s: string) => Promise<void>
  addExpenseCategory: (c: string) => Promise<void>
  removeExpenseCategory: (c: string) => Promise<void>
  setRevenueGoal: (v: number) => Promise<void>

  loginAdmin: (email: string, pass: string) => boolean
  logoutAdmin: () => void
  loginMentee: (email: string) => boolean
  logoutMentee: () => void

  setEmailConfig: (config: EmailConfig) => Promise<void>
  setAutomationConfig: (config: AutomationConfig) => Promise<void>
  setSessionReminderConfig: (config: SessionReminderConfig) => Promise<void>
  setMessageTemplates: (templates: MessageTemplates) => Promise<void>
  addNotificationLog: (log: NotificationLog) => Promise<void>

  refreshState: () => void
  isSyncing: boolean
  isInitialLoad: boolean
  syncData: () => Promise<void>
  resetSystem: () => Promise<void>
}

// Read initial auth state from localStorage to prevent routing loops
const initialAdminAuth = JSON.parse(
  localStorage.getItem('adminAuth') || '{"isAuthenticated": false}',
)
const initialMenteeAuth = JSON.parse(
  localStorage.getItem('menteeAuth') || '{"isAuthenticated": false, "menteeId": null}',
)

const initialState: MainState = {
  company: 'Todas',
  companies: [],
  banks: [],
  services: [],
  suppliers: [],
  expenseCategories: [],
  paymentMethods: [],
  transactions: [],
  leads: [],
  mentees: [],
  clients: [],
  timeSlots: [],
  revenueGoal: 0,
  adminAuth: initialAdminAuth,
  menteeAuth: initialMenteeAuth,
  emailConfig: { provider: '', apiKey: '', senderEmail: '', senderName: '' },
  automationConfig: {
    sendSlipOnGeneration: false,
    sendReminder: false,
    reminderDaysBefore: 1,
    sendOverdue: false,
  },
  sessionReminderConfig: {
    enabled: false,
    hoursBefore: 24,
    channels: { email: false, whatsapp: false },
  },
  messageTemplates: { emailSubject: '', emailBody: '', whatsappBody: '', defaultMeetingLink: '' },
  notificationLogs: [],
}

const MainContext = createContext<MainContextType | null>(null)

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MainState>(initialState)
  const stateRef = useRef(state)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const isSyncingRef = useRef(false)

  const syncData = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      const parsed = await CloudAPI.getState()
      if (parsed) {
        setState((prev) => {
          // Merge parsed cloud state, but preserve local UI/Auth states
          const next = {
            ...parsed,
            company: prev.company,
            adminAuth: prev.adminAuth,
            menteeAuth: prev.menteeAuth,
          }
          if (JSON.stringify(prev) === JSON.stringify(next)) {
            return prev
          }
          stateRef.current = next
          return next
        })
      }
    } catch (e) {
      console.error('Error syncing state from cloud:', e)
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [])

  const updateState = async (updater: (s: MainState) => MainState) => {
    const prevState = stateRef.current
    const nextState = updater(prevState)

    setState(nextState)
    stateRef.current = nextState

    try {
      await CloudAPI.saveState(nextState)
    } catch (err) {
      console.error('Cloud DB Error:', err)
      setState(prevState)
      stateRef.current = prevState
      throw new Error('Falha na conexão com o banco de dados nuvem.')
    }
  }

  const resetSystem = useCallback(async () => {
    try {
      await CloudAPI.reset()
      const parsed = await CloudAPI.getState()
      setState((prev) => {
        const next = {
          ...parsed,
          adminAuth: prev.adminAuth,
          menteeAuth: prev.menteeAuth,
          company: prev.company,
        }
        stateRef.current = next
        return next
      })
    } catch (err) {
      console.error('Error in resetSystem', err)
      throw new Error('Falha ao limpar o banco de dados nuvem.')
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const doSync = async () => {
      await syncData()
      if (mounted) setIsInitialLoad(false)
    }
    doSync()

    const interval = setInterval(syncData, 15000)
    const handleFocus = () => syncData()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncData()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleFocus)

    window.addEventListener('sgfm_cloud_sync_event', handleFocus)

    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('sgfm_cloud_sync')
      bc.onmessage = () => syncData()
    } catch {
      // ignore broadcast channel errors
    }

    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleFocus)
      window.removeEventListener('sgfm_cloud_sync_event', handleFocus)
      if (bc) bc.close()
    }
  }, [syncData])

  const refreshState = useCallback(() => {
    syncData()
  }, [syncData])

  const setCompany = (company: string) => {
    setState((s) => {
      const next = { ...s, company }
      stateRef.current = next
      return next
    })
  }

  const loginAdmin = (email: string, pass: string) => {
    if (email === 'admin@flaviomoura.com.br' && pass === 'admin123') {
      const auth = { isAuthenticated: true }
      localStorage.setItem('adminAuth', JSON.stringify(auth))
      setState((s) => {
        const next = { ...s, adminAuth: auth }
        stateRef.current = next
        return next
      })
      return true
    }
    return false
  }

  const logoutAdmin = () => {
    localStorage.removeItem('adminAuth')
    setState((s) => {
      const next = { ...s, adminAuth: { isAuthenticated: false } }
      stateRef.current = next
      return next
    })
  }

  const loginMentee = (email: string) => {
    const mentee = stateRef.current.mentees.find(
      (m) => m.email?.toLowerCase() === email.toLowerCase(),
    )
    if (mentee) {
      const auth = { isAuthenticated: true, menteeId: mentee.id }
      localStorage.setItem('menteeAuth', JSON.stringify(auth))
      setState((s) => {
        const next = { ...s, menteeAuth: auth }
        stateRef.current = next
        return next
      })
      return true
    }
    return false
  }

  const logoutMentee = () => {
    localStorage.removeItem('menteeAuth')
    setState((s) => {
      const next = { ...s, menteeAuth: { isAuthenticated: false, menteeId: null } }
      stateRef.current = next
      return next
    })
  }

  const setRevenueGoal = async (revenueGoal: number) => updateState((s) => ({ ...s, revenueGoal }))
  const addTransaction = async (t: Transaction) =>
    updateState((s) => ({ ...s, transactions: [...s.transactions, t] }))
  const addTransactions = async (t: Transaction[]) =>
    updateState((s) => ({ ...s, transactions: [...s.transactions, ...t] }))
  const updateTransaction = async (id: string, updates: Partial<Transaction>) =>
    updateState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  const updateTransactionGroup = async (
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
  const removeTransaction = async (id: string) =>
    updateState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))

  const addLead = async (l: Lead) => updateState((s) => ({ ...s, leads: [...s.leads, l] }))
  const updateLead = async (id: string, updates: Partial<Lead>) =>
    updateState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }))
  const removeLead = async (id: string) =>
    updateState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }))

  const addMentee = async (m: Mentee) => updateState((s) => ({ ...s, mentees: [...s.mentees, m] }))
  const addMenteeSession = async (menteeId: string, session: Session) =>
    updateState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, sessions: [...(m.sessions || []), session] } : m,
      ),
    }))
  const updateMenteeSession = async (
    menteeId: string,
    sessionId: string,
    updates: Partial<Session>,
  ) =>
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
  const removeMenteeSession = async (menteeId: string, sessionId: string) =>
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
  const updateMentee = async (id: string, updates: Partial<Mentee>) =>
    updateState((s) => ({
      ...s,
      mentees: s.mentees.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))
  const removeMentee = async (id: string) =>
    updateState((s) => {
      const menteeToDelete = s.mentees.find((m) => m.id === id)
      const emailToUnbook = menteeToDelete?.email?.toLowerCase()
      const updatedTxs = s.transactions.filter(
        (tx) =>
          !(
            tx.description.startsWith('Mentoria Avulsa') &&
            tx.client === menteeToDelete?.name &&
            tx.status === 'Pendente'
          ),
      )
      return {
        ...s,
        mentees: s.mentees.filter((m) => m.id !== id),
        transactions: updatedTxs,
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
  const addMenteeEmailLog = async (menteeId: string, log: EmailLog) =>
    updateState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, emailLogs: [log, ...(m.emailLogs || [])] } : m,
      ),
    }))

  const addClient = async (c: Client) => updateState((s) => ({ ...s, clients: [...s.clients, c] }))
  const updateClient = async (id: string, updates: Partial<Client>) =>
    updateState((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  const removeClient = async (id: string) =>
    updateState((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }))
  const addClientInteraction = async (clientId: string, interaction: Interaction) =>
    updateState((s) => ({
      ...s,
      clients: s.clients.map((c) =>
        c.id === clientId ? { ...c, interactions: [...(c.interactions || []), interaction] } : c,
      ),
    }))

  const addTimeSlot = async (ts: TimeSlot) => {
    let newTs = ts
    if (CloudAPI.addTimeSlot) {
      const added = await CloudAPI.addTimeSlot(ts)
      if (added && added.id) {
        newTs = { ...ts, id: added.id }
      }
    }
    return updateState((s) => ({ ...s, timeSlots: [...s.timeSlots, newTs] }))
  }

  const updateTimeSlot = async (id: string, updates: Partial<TimeSlot>) => {
    if (CloudAPI.updateTimeSlot) {
      await CloudAPI.updateTimeSlot(id, updates)
    }
    return updateState((s) => ({
      ...s,
      timeSlots: s.timeSlots.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  }

  const removeTimeSlot = async (id: string) => {
    if (CloudAPI.removeTimeSlot) {
      await CloudAPI.removeTimeSlot(id)
    }
    return updateState((s) => {
      const slot = s.timeSlots.find((t) => t.id === id)
      const updatedTxs = s.transactions.filter(
        (tx) =>
          !(
            tx.description.startsWith('Mentoria Avulsa') &&
            tx.client === slot?.menteeName &&
            tx.date === slot?.date &&
            tx.status === 'Pendente'
          ),
      )
      return { ...s, transactions: updatedTxs, timeSlots: s.timeSlots.filter((t) => t.id !== id) }
    })
  }

  const bookTimeSlot = async (id: string, name: string, email: string, company: string) => {
    if (CloudAPI.updateTimeSlot) {
      await CloudAPI.updateTimeSlot(id, {
        isBooked: true,
        menteeName: name,
        menteeEmail: email,
        menteeCompany: company,
      })
    }
    return updateState((s) => {
      const slot = s.timeSlots.find((t) => t.id === id)
      const newTx: Transaction | null = slot
        ? {
            id: Math.random().toString(36).substr(2, 9),
            description: `Mentoria Avulsa - ${name}`,
            amount: 500,
            date: slot.date,
            entryDate: new Date().toISOString().split('T')[0],
            type: 'Receita',
            status: 'Pendente',
            company: s.companies[0] || 'Grupo Flávio Moura',
            bank: s.banks[0] || 'Banco Itaú',
            service: 'Mentoria',
            client: name,
            paymentMethod: 'PIX',
            performer: 'Eu',
          }
        : null
      return {
        ...s,
        timeSlots: s.timeSlots.map((t) =>
          t.id === id
            ? { ...t, isBooked: true, menteeName: name, menteeEmail: email, menteeCompany: company }
            : t,
        ),
        transactions: newTx ? [...s.transactions, newTx] : s.transactions,
      }
    })
  }

  const unbookTimeSlot = async (id: string) => {
    if (CloudAPI.updateTimeSlot) {
      await CloudAPI.updateTimeSlot(id, {
        isBooked: false,
        menteeName: '',
        menteeEmail: '',
        menteeCompany: '',
      })
    }
    return updateState((s) => {
      const slot = s.timeSlots.find((t) => t.id === id)
      const updatedTxs = s.transactions.filter(
        (tx) =>
          !(
            tx.description.startsWith('Mentoria Avulsa') &&
            tx.client === slot?.menteeName &&
            tx.date === slot?.date &&
            tx.status === 'Pendente'
          ),
      )
      return {
        ...s,
        transactions: updatedTxs,
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
      }
    })
  }

  const addCompany = async (c: string) => {
    if (CloudAPI.addCompany) await CloudAPI.addCompany(c)
    return updateState((s) => ({ ...s, companies: [...s.companies, c] }))
  }
  const removeCompany = async (c: string) => {
    if (CloudAPI.removeCompany) await CloudAPI.removeCompany(c)
    return updateState((s) => ({ ...s, companies: s.companies.filter((x) => x !== c) }))
  }
  const addBank = async (b: string) => {
    if (CloudAPI.addBank) await CloudAPI.addBank(b)
    return updateState((s) => ({ ...s, banks: [...s.banks, b] }))
  }
  const removeBank = async (b: string) => {
    if (CloudAPI.removeBank) await CloudAPI.removeBank(b)
    return updateState((s) => ({ ...s, banks: s.banks.filter((x) => x !== b) }))
  }
  const addService = async (srv: string) => {
    if (CloudAPI.addService) await CloudAPI.addService(srv)
    return updateState((s) => ({ ...s, services: [...s.services, srv] }))
  }
  const removeService = async (srv: string) => {
    if (CloudAPI.removeService) await CloudAPI.removeService(srv)
    return updateState((s) => ({ ...s, services: s.services.filter((x) => x !== srv) }))
  }
  const addSupplier = async (sup: string) =>
    updateState((s) => ({ ...s, suppliers: [...s.suppliers, sup] }))
  const removeSupplier = async (sup: string) =>
    updateState((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x !== sup) }))
  const addExpenseCategory = async (cat: string) =>
    updateState((s) => ({ ...s, expenseCategories: [...s.expenseCategories, cat] }))
  const removeExpenseCategory = async (cat: string) =>
    updateState((s) => ({ ...s, expenseCategories: s.expenseCategories.filter((x) => x !== cat) }))

  const setEmailConfig = async (config: EmailConfig) =>
    updateState((s) => ({ ...s, emailConfig: config }))
  const setAutomationConfig = async (config: AutomationConfig) =>
    updateState((s) => ({ ...s, automationConfig: config }))
  const setSessionReminderConfig = async (config: SessionReminderConfig) =>
    updateState((s) => ({ ...s, sessionReminderConfig: config }))
  const setMessageTemplates = async (templates: MessageTemplates) =>
    updateState((s) => ({ ...s, messageTemplates: templates }))
  const addNotificationLog = async (log: NotificationLog) =>
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
      addLead,
      updateLead,
      removeLead,
      addMentee,
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
      resetSystem,
    }),
    [state, refreshState, syncData, resetSystem, isSyncing, isInitialLoad],
  )

  return React.createElement(MainContext.Provider, { value }, children)
}

export function useMainStore() {
  const context = useContext(MainContext)
  if (!context) throw new Error('useMainStore must be used within MainProvider')
  return context
}
