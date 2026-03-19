import React, { createContext, useContext, useState } from 'react'
import { CompanyName, Transaction, Lead, Mentee, Client, Session } from '@/lib/types'
import { mockTransactions, mockLeads, mockMentees, mockClients } from '@/lib/mockData'

interface MainState {
  company: CompanyName
  transactions: Transaction[]
  leads: Lead[]
  mentees: Mentee[]
  clients: Client[]
}

interface MainContextType extends MainState {
  setCompany: (c: CompanyName) => void
  addTransaction: (t: Transaction) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  addMenteeSession: (menteeId: string, session: Session) => void
}

const MainContext = createContext<MainContextType | null>(null)

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MainState>({
    company: 'Todas',
    transactions: mockTransactions,
    leads: mockLeads,
    mentees: mockMentees,
    clients: mockClients,
  })

  const setCompany = (company: CompanyName) => setState((s) => ({ ...s, company }))

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

  const value = React.useMemo(
    () => ({
      ...state,
      setCompany,
      addTransaction,
      updateLead,
      addMenteeSession,
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
