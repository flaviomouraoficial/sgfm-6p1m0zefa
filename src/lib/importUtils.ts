import { Transaction, TransactionType } from '@/lib/types'

export interface ParsedRow {
  isValid: boolean
  errors: string[]
  data: Partial<Transaction>
  raw: Record<string, any>
  rowIndex: number
}

export const parseCSVContent = (text: string): { headers: string[]; rows: any[][] } => {
  const firstLineIdx = text.indexOf('\n')
  const firstLine = text.slice(0, firstLineIdx > -1 ? firstLineIdx : text.length)
  const sep =
    (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ','

  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const nextC = text[i + 1]

    if (c === '"') {
      if (inQuotes && nextC === '"') {
        currentCell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === sep && !inQuotes) {
      currentRow.push(currentCell)
      currentCell = ''
    } else if ((c === '\n' || (c === '\r' && nextC === '\n')) && !inQuotes) {
      if (c === '\r') i++
      currentRow.push(currentCell)
      if (currentRow.some((cell) => cell.trim() !== '')) {
        rows.push(currentRow)
      }
      currentRow = []
      currentCell = ''
    } else {
      currentCell += c
    }
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell)
    if (currentRow.some((cell) => cell.trim() !== '')) {
      rows.push(currentRow)
    }
  }

  if (rows.length < 2) return { headers: [], rows: [] }

  const headers = rows[0].map((h) => h.trim())
  const dataRows = rows.slice(1).map((r) => {
    const paddedRow = [...r]
    while (paddedRow.length < headers.length) paddedRow.push('')
    return paddedRow.map((c) => c.trim())
  })

  return { headers, rows: dataRows }
}

export const parseDateStr = (dtStr: any): string | null => {
  if (!dtStr) return null
  const str = String(dtStr).trim()
  let y, m, d

  if (/^\d+$/.test(str) && parseInt(str, 10) > 10000) {
    // Excel serial date format
    const excelDate = parseInt(str, 10)
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000))
    y = date.getUTCFullYear()
    m = date.getUTCMonth() + 1
    d = date.getUTCDate()
  } else if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(str)) {
    const parts = str.substring(0, 10).split('-')
    y = parseInt(parts[0], 10)
    m = parseInt(parts[1], 10)
    d = parseInt(parts[2], 10)
  } else if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length === 3) {
      d = parseInt(parts[0], 10)
      m = parseInt(parts[1], 10)
      y = parseInt(parts[2], 10)
    }
  } else if (str.includes('-')) {
    const parts = str.split('-')
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10)
        m = parseInt(parts[1], 10)
        d = parseInt(parts[2], 10)
      } else {
        d = parseInt(parts[0], 10)
        m = parseInt(parts[1], 10)
        y = parseInt(parts[2], 10)
      }
    }
  }

  if (y && m && d && y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
    const date = new Date(
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00Z`,
    )
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  }
  return null
}

export const validateImportData = (
  headers: string[],
  rows: any[][],
  mapping: Record<string, string>,
  type: TransactionType,
): ParsedRow[] => {
  const sanitize = (str: any) => {
    if (str === null || str === undefined) return ''
    return String(str)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
  }

  return rows.map((rowArr, index) => {
    const raw = headers.reduce(
      (acc, h, i) => ({ ...acc, [h]: rowArr[i] }),
      {} as Record<string, any>,
    )
    const errors: string[] = []
    const data: Partial<Transaction> = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      status: 'Pendente',
      performer: 'Eu',
      company: 'Grupo Flávio Moura',
      bank: 'Banco Itaú',
    }

    const getVal = (key: string) => sanitize(raw[mapping[key]])
    const getRawVal = (key: string) => raw[mapping[key]]

    const dtStr = getVal('date')
    if (!dtStr) {
      errors.push(`O campo 'Data de Vencimento' é obrigatório`)
    } else {
      const parsedDate = parseDateStr(dtStr)
      if (!parsedDate) {
        errors.push(
          `O campo 'Data de Vencimento' possui um formato inválido (${getRawVal('date')})`,
        )
      } else {
        data.date = parsedDate
      }
    }

    const entryDtStr = getVal('entryDate')
    if (entryDtStr) {
      const parsedEntry = parseDateStr(entryDtStr)
      if (!parsedEntry) {
        errors.push(
          `O campo 'Data de Lançamento' possui um formato inválido (${getRawVal('entryDate')})`,
        )
      } else {
        data.entryDate = parsedEntry
      }
    } else {
      data.entryDate = new Date().toISOString().split('T')[0]
    }

    data.description = getVal('description')
    if (!data.description) errors.push(`O campo 'Descrição' é obrigatório`)

    const valStrRaw = getRawVal('amount')
    const valSanitized = getVal('amount')
    if (!valSanitized) {
      errors.push(`O campo 'Valor' é obrigatório`)
    } else {
      let valStr = valSanitized
        .replace(/R\$\s?/gi, '')
        .replace(/\s+/g, '')
        .trim()
      let parsedVal: number = NaN

      const lastComma = valStr.lastIndexOf(',')
      const lastDot = valStr.lastIndexOf('.')

      if (lastComma > lastDot) {
        valStr = valStr.replace(/\./g, '').replace(',', '.')
        parsedVal = parseFloat(valStr)
      } else if (lastDot > lastComma) {
        valStr = valStr.replace(/,/g, '')
        parsedVal = parseFloat(valStr)
      } else if (lastComma !== -1) {
        valStr = valStr.replace(',', '.')
        parsedVal = parseFloat(valStr)
      } else {
        parsedVal = parseFloat(valStr)
      }

      if (isNaN(parsedVal)) {
        errors.push(`O campo 'Valor' possui um formato inválido (${valStrRaw})`)
      } else {
        data.amount = parsedVal
      }
    }

    const entityLabel = type === 'Receita' ? 'Cliente' : 'Fornecedor'
    const entity = getVal('entity')
    if (!entity) {
      errors.push(`O campo '${entityLabel}' é obrigatório`)
    } else {
      if (type === 'Receita') data.client = entity
      else data.supplier = entity
    }

    const cat = getVal('category')
    if (cat) {
      if (type === 'Receita') data.service = cat
      else data.category = cat
    } else {
      if (type === 'Receita') data.service = 'Outros'
      else data.category = 'Outros'
    }

    const statusVal = getVal('status').toLowerCase()
    if (statusVal.includes('pago') || statusVal.includes('recebido')) {
      data.status = 'Pago'
    } else if (statusVal.includes('pendente')) {
      data.status = 'Pendente'
    }

    data.paymentMethod = getVal('paymentMethod') || 'PIX'

    return { isValid: errors.length === 0, errors, data, raw, rowIndex: index + 2 }
  })
}
