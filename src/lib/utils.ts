import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function filterByDateRange<T extends { date: string }>(items: T[], range: string): T[] {
  if (range === 'all') return items

  const now = new Date()

  return items.filter((item) => {
    const itemDate = new Date(item.date)

    if (range === 'day') {
      return itemDate.toDateString() === now.toDateString()
    }

    if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return itemDate >= weekAgo && itemDate <= now
    }

    if (range === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    }

    return true
  })
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCurrencyInput(value: string) {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''

  const amount = parseInt(numbers, 10) / 100

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export function parseCurrencyInput(value: string) {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return 0
  return parseInt(numbers, 10) / 100
}

export function exportToCSV(filename: string, data: any[]) {
  if (!data || !data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          let val = row[header]
          if (val === null || val === undefined) val = ''
          if (typeof val === 'object') val = JSON.stringify(val)
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateGoogleCalendarLink(
  title: string,
  dateStr: string,
  durationMin: number = 60,
  details: string = '',
) {
  const startDate = new Date(dateStr)
  if (isNaN(startDate.getTime())) return '#'

  const endDate = new Date(startDate.getTime() + durationMin * 60000)

  const formatGCalDate = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '')
  }

  const start = formatGCalDate(startDate)
  const end = formatGCalDate(endDate)

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.append('action', 'TEMPLATE')
  url.searchParams.append('text', title)
  url.searchParams.append('dates', `${start}/${end}`)
  if (details) {
    url.searchParams.append('details', details)
  }

  return url.toString()
}
