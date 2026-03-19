/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCSV(filename: string, rows: any[]) {
  if (!rows || !rows.length) return
  const separator = ','

  // Collect all unique keys
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))

  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k]
            if (typeof cell === 'object') cell = JSON.stringify(cell)
            cell = cell.toString().replace(/"/g, '""')
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`
            return cell
          })
          .join(separator)
      })
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function generateGoogleCalendarLink(
  title: string,
  date: string,
  durationMinutes: number,
  description: string,
) {
  try {
    const start = new Date(date)
    if (isNaN(start.getTime())) return '#'
    const end = new Date(start.getTime() + durationMinutes * 60000)

    const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '')

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${formatTime(start)}/${formatTime(end)}`,
      details: description,
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  } catch {
    return '#'
  }
}
