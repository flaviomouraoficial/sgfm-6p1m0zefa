import React, { createContext, useContext, useState } from 'react'
import { Transaction, Lead, Mentee, Client, Session } from '@/lib/types'
import { mockTransactions, mockLeads, mockMentees, mockClients } from '@/lib/mockData'

interface MainState {
  company: string
  companies: string[]
  banks: string[]
  services: string[]
  transactions: Transaction[]
  leads: Lead[]
  mentees: Mentee[]
  clients: Client[]
}

interface MainContextType extends MainState {
  setCompany: (c: string) => void
  addTransaction: (t: Transaction) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  addMenteeSession: (menteeId: string, session: Session) => void
  addCompany: (c: string) => void
  removeCompany: (c: string) => void
  addBank: (b: string) => void
  removeBank: (b: string) => void
  addService: (s: string) => void
  removeService: (s: string) => void
}

const defaultCompanies = ['Grupo Flávio Moura', 'FM Academy', 'FM Consultoria']
const defaultBanks = ['Banco Itaú', 'Banco Nubank']
const defaultServices = ['Consultoria', 'Mentoria', 'Software', 'Marketing']

const MainContext = createContext<MainContextType | null>(null)

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MainState>({
    company: 'Todas',
    companies: defaultCompanies,
    banks: defaultBanks,
    services: defaultServices,
    transactions: mockTransactions,
    leads: mockLeads,
    mentees: mockMentees,
    clients: mockClients,
  })

  const setCompany = (company: string) => setState((s) => ({ ...s, company }))

  const addTransaction = (t: Transaction) =>
    setState((s) => ({ ...s, transactions: [...s.transactions, t] }))

  const updateLead = (id: string, updates: Partial<Lead>) =>
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }))

  const addMenteeSession = (menteeId: string, session: Session) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, sessions: [...m.sessions, session] } : m,
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

  const value = React.useMemo(
    () => ({
      ...state,
      setCompany,
      addTransaction,
      updateLead,
      addMenteeSession,
      addCompany,
      removeCompany,
      addBank,
      removeBank,
      addService,
      removeService,
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
