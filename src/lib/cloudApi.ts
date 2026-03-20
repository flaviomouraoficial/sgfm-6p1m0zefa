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

const STORAGE_KEY = 'sgfm_cloud_db_v2'

/**
 * Mock Cloud Database API
 * In a real scenario, this would use fetch() to a centralized backend (e.g. Supabase, Firebase).
 * We simulate network latency and use a specific localStorage key with BroadcastChannel events
 * to provide a robust cross-device synchronization experience for the demo.
 */
export const CloudAPI = {
  async getState() {
    // Simulate network latency for Hard Fetch
    await new Promise((resolve) => setTimeout(resolve, 600))
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch (e) {
        console.error('Failed to parse cloud data', e)
      }
    }
    // Seed database if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState))
    return defaultState
  },

  async saveState(state: any) {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 400))

    // We omit local UI state (adminAuth, menteeAuth, company filter) from the cloud DB
    const { adminAuth, menteeAuth, company, ...cloudData } = state

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData))
    // Simulate cross-device push notification
    window.dispatchEvent(new Event('sgfm_cloud_sync_event'))
  },

  async reset() {
    // Simulate network latency for maintenance task
    await new Promise((resolve) => setTimeout(resolve, 800))
    const emptyState = {
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
      messageTemplates: {
        emailSubject: '',
        emailBody: '',
        whatsappBody: '',
        defaultMeetingLink: '',
      },
      notificationLogs: [],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState))
    window.dispatchEvent(new Event('sgfm_cloud_sync_event'))
  },
}
