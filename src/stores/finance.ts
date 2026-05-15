import { create } from 'zustand'
import pb from '@/lib/pocketbase/client'
import { ContaFinanceira } from '@/lib/types'

interface FinanceStore {
  contas: ContaFinanceira[]
  fetchContas: () => Promise<void>
  addConta: (data: Partial<ContaFinanceira>) => Promise<void>
  updateConta: (id: string, data: Partial<ContaFinanceira>) => Promise<void>
  deleteConta: (id: string) => Promise<void>
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  contas: [],
  fetchContas: async () => {
    try {
      const records = await pb.collection('v1_contas_financeiras').getFullList<ContaFinanceira>()
      set({ contas: records })
    } catch (e) {
      console.error('Error fetching contas', e)
    }
  },
  addConta: async (data) => {
    const record = await pb.collection('v1_contas_financeiras').create<ContaFinanceira>(data)
    set((state) => ({ contas: [...state.contas, record] }))
  },
  updateConta: async (id, data) => {
    const record = await pb.collection('v1_contas_financeiras').update<ContaFinanceira>(id, data)
    set((state) => ({
      contas: state.contas.map((c) => (c.id === id ? record : c)),
    }))
  },
  deleteConta: async (id) => {
    await pb.collection('v1_contas_financeiras').delete(id)
    set((state) => ({ contas: state.contas.filter((c) => c.id !== id) }))
  },
}))
