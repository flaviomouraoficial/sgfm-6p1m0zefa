import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentItem {
  id: string
  title: string
  url: string
  iconType: 'receipt' | 'diagnostic' | 'disc' | 'assessment' | 'target'
  timestamp: number
}

interface RecentStore {
  items: RecentItem[]
  addItem: (item: Omit<RecentItem, 'timestamp'>) => void
  clear: () => void
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== item.id && i.url !== item.url)
          filtered.unshift({ ...item, timestamp: Date.now() })
          return { items: filtered.slice(0, 3) }
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'sgfm-recent-items',
    },
  ),
)
