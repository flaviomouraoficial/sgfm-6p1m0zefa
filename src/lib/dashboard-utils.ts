import { useState, useMemo } from 'react'

export type AlertLevel = 'overdue' | 'upcoming' | 'normal'

export function getAlertLevel(dateStr?: string): AlertLevel {
  if (!dateStr) return 'normal'
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) return 'normal'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const itemDate = new Date(date)
  itemDate.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((itemDate.getTime() - today.getTime()) / 86400000)
  if (diffDays <= 0) return 'overdue'
  if (diffDays <= 5) return 'upcoming'
  return 'normal'
}

export type PeriodType = 'all' | 'today' | 'week' | 'month' | 'custom'

export function getPeriodRange(
  period: PeriodType,
  customStart?: string,
  customEnd?: string,
): { start: Date; end: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  switch (period) {
    case 'today': {
      const end = new Date(today)
      end.setHours(23, 59, 59, 999)
      return { start: today, end }
    }
    case 'week': {
      const day = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      return { start: monday, end: sunday }
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
    case 'custom': {
      const start = customStart ? new Date(customStart + 'T00:00:00') : new Date(0)
      const end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date(8640000000000000)
      return { start, end }
    }
    default:
      return { start: new Date(0), end: new Date(8640000000000000) }
  }
}

export function isWithinPeriod(dateStr: string, range: { start: Date; end: Date }): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) return false
  return date >= range.start && date <= range.end
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function useWidgetFilters(defaultPeriod: PeriodType = 'month') {
  const [period, setPeriod] = useState<PeriodType>(defaultPeriod)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [status, setStatus] = useState('all')
  const range = useMemo(
    () => getPeriodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  )
  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') setCustomStart(value)
    else setCustomEnd(value)
  }
  return {
    period,
    setPeriod,
    customStart,
    customEnd,
    handleCustomDateChange,
    status,
    setStatus,
    range,
  }
}

export function deriveStatusOptions(items: any[], field: string) {
  const values = [...new Set(items.map((i) => i?.[field]).filter(Boolean))] as string[]
  return values.map((v) => ({ value: v, label: v }))
}
