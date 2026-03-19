import React, { createContext, useContext, useState } from 'react'
import { Transaction, Lead, Mentee, Client, Session } from '@/lib/types'
import { mockTransactions, mockLeads, mockMentees, mockClients } from '@/lib/mockData'

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
}

interface MainContextType extends MainState {
  setCompany: (c: string) => void
  addTransaction: (t: Transaction) => void
  addTransactions: (t: Transaction[]) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  removeTransaction: (id: string) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  addMenteeSession: (menteeId: string, session: Session) => void
  updateMentee: (id: string, updates: Partial<Mentee>) => void
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
  })

  const setCompany = (company: string) => setState((s) => ({ ...s, company }))

  const addTransaction = (t: Transaction) =>
    setState((s) => ({ ...s, transactions: [...s.transactions, t] }))

  const addTransactions = (t: Transaction[]) =>
    setState((s) => ({ ...s, transactions: [...s.transactions, ...t] }))

  const updateTransaction = (id: string, updates: Partial<Transaction>) =>
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))

  const removeTransaction = (id: string) =>
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))

  const updateLead = (id: string, updates: Partial<Lead>) =>
    setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)) }))

  const addMenteeSession = (menteeId: string, session: Session) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) =>
        m.id === menteeId ? { ...m, sessions: [...m.sessions, session] } : m,
      ),
    }))

  const updateMentee = (id: string, updates: Partial<Mentee>) =>
    setState((s) => ({
      ...s,
      mentees: s.mentees.map((m) => (m.id === id ? { ...m, ...updates } : m)),
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

  const value = React.useMemo(
    () => ({
      ...state,
      setCompany,
      addTransaction,
      addTransactions,
      updateTransaction,
      removeTransaction,
      updateLead,
      addMenteeSession,
      updateMentee,
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
