import {
  mockTransactions,
  mockLeads,
  mockMentees,
  mockClients,
  mockTimeSlots,
  mockTemplates,
  mockNotificationLogs,
} from './mockData'

const defaultState = {
  // Mock fallback if PocketBase fails or is unavailable
  companies: ['Grupo Flávio Moura', 'FM Academy', 'FM Consultoria'],
  banks: ['Banco Itaú', 'Banco Nubank'],
  services: ['Consultoria', 'Mentoria', 'Software', 'Marketing'],
  suppliers: ['Amazon AWS', 'Google Workspace', 'Facebook Ads', 'Escritório Contábil'],
  expenseCategories: ['Software', 'Marketing', 'Infraestrutura', 'Impostos', 'Outros'],
  paymentMethods: ['PIX', 'Cartão de Crédito', 'Boleto', 'Transferência Bancária'],
  transactions: mockTransactions,
  leads: mockLeads,
  mentees: mockMentees,
  clients: mockClients,
  timeSlots: mockTimeSlots,
  revenueGoal: 20000,
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
    channels: { email: true, whatsapp: false },
  },
  messageTemplates: mockTemplates,
  notificationLogs: mockNotificationLogs,
}

const DB_NAME = 'SGFM_CloudDB_v3'
const STORE_NAME = 'state_store'

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const idbGet = async (key: string): Promise<any> => {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

const idbSet = async (key: string, value: any): Promise<void> => {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // silently fail on mobile if IDB is constrained
  }
}

const idbClear = async (): Promise<void> => {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // silently fail
  }
}

const pbFetch = async (collection: string): Promise<string[] | null> => {
  try {
    const res = await fetch(`/api/collections/${collection}/records?perPage=500`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.items) {
        return data.items.map((item: any) => item.name || item.title || item.value).filter(Boolean)
      }
    }
  } catch (e) {
    console.warn(`PocketBase fetch failed for ${collection}`, e)
  }
  return null
}

const pbAdd = async (collection: string, name: string) => {
  try {
    await fetch(`/api/collections/${collection}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  } catch (e) {
    console.warn(`PocketBase add failed for ${collection}`, e)
  }
}

const pbRemove = async (collection: string, name: string) => {
  try {
    const res = await fetch(
      `/api/collections/${collection}/records?filter=(name='${encodeURIComponent(name)}')`,
    )
    if (res.ok) {
      const data = await res.json()
      if (data && data.items && data.items.length > 0) {
        const id = data.items[0].id
        await fetch(`/api/collections/${collection}/records/${id}`, {
          method: 'DELETE',
        })
      }
    }
  } catch (e) {
    console.warn(`PocketBase remove failed for ${collection}`, e)
  }
}

const notifySync = () => {
  window.dispatchEvent(new Event('sgfm_cloud_sync_event'))
  try {
    const channel = new BroadcastChannel('sgfm_cloud_sync')
    channel.postMessage('sync')
    channel.close()
  } catch {
    // silently fail
  }
}

export const CloudAPI = {
  async getState() {
    await new Promise((resolve) => setTimeout(resolve, 600))

    let state: any = await idbGet('app_state')

    if (!state) {
      state = { ...defaultState }
      await idbSet('app_state', state)
    }

    const [pbCompanies, pbBanks, pbServices] = await Promise.all([
      pbFetch('companies'),
      pbFetch('banks'),
      pbFetch('services'),
    ])

    if (pbCompanies) state.companies = pbCompanies
    if (pbBanks) state.banks = pbBanks
    if (pbServices) state.services = pbServices

    return state
  },

  async saveState(state: any) {
    const { adminAuth, menteeAuth, company, ...cloudData } = state
    await idbSet('app_state', cloudData)
    notifySync()
  },

  async reset() {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await idbClear()
    notifySync()
  },

  async addCompany(name: string) {
    await pbAdd('companies', name)
  },
  async removeCompany(name: string) {
    await pbRemove('companies', name)
  },
  async addBank(name: string) {
    await pbAdd('banks', name)
  },
  async removeBank(name: string) {
    await pbRemove('banks', name)
  },
  async addService(name: string) {
    await pbAdd('services', name)
  },
  async removeService(name: string) {
    await pbRemove('services', name)
  },
}
