import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export type WidgetId = 'crm' | 'payable' | 'receivable' | 'proposals' | 'tasks' | 'indicators'

export const WIDGET_LABELS: Record<WidgetId, string> = {
  crm: 'Oportunidades CRM',
  payable: 'Contas a Pagar',
  receivable: 'Contas a Receber',
  proposals: 'Propostas',
  tasks: 'Tarefas da Equipe',
  indicators: 'Indicadores Comerciais',
}

const DEFAULT_VISIBLE: Record<WidgetId, boolean> = {
  crm: true,
  payable: true,
  receivable: true,
  proposals: true,
  tasks: true,
  indicators: true,
}

const DEFAULT_COLLAPSED: Record<WidgetId, boolean> = {
  crm: false,
  payable: false,
  receivable: false,
  proposals: false,
  tasks: false,
  indicators: false,
}

export function useDashboardPrefs() {
  const { user } = useAuth()
  const [visible, setVisible] = useState<Record<WidgetId, boolean>>(DEFAULT_VISIBLE)
  const [collapsed, setCollapsed] = useState<Record<WidgetId, boolean>>(DEFAULT_COLLAPSED)

  useEffect(() => {
    if (user) {
      const dash = user.preferences?.dashboard || {}
      setVisible({ ...DEFAULT_VISIBLE, ...(dash.visible || {}) })
      setCollapsed({ ...DEFAULT_COLLAPSED, ...(dash.collapsed || {}) })
    }
  }, [user])

  const persist = useCallback(
    async (vis: Record<WidgetId, boolean>, col: Record<WidgetId, boolean>) => {
      if (!user) return
      try {
        const prefs = user.preferences || {}
        await pb.collection('users').update(user.id, {
          preferences: { ...prefs, dashboard: { visible: vis, collapsed: col } },
        })
      } catch (err) {
        console.error('Failed to save dashboard prefs', err)
      }
    },
    [user],
  )

  const toggleWidget = useCallback(
    (id: WidgetId) => {
      setVisible((prev) => {
        const next = { ...prev, [id]: !prev[id] }
        persist(next, collapsed)
        return next
      })
    },
    [collapsed, persist],
  )

  const toggleCollapse = useCallback(
    (id: WidgetId) => {
      setCollapsed((prev) => {
        const next = { ...prev, [id]: !prev[id] }
        persist(visible, next)
        return next
      })
    },
    [visible, persist],
  )

  return { visible, collapsed, toggleWidget, toggleCollapse }
}
