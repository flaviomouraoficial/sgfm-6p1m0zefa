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
