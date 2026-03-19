import { Transaction, TransactionType } from '@/lib/types'

export interface ParsedRow {
  isValid: boolean
  errors: string[]
  data: Partial<Transaction>
  raw: Record<string, any>
  rowIndex: number
}

export const parseCSVContent = (text: string): { headers: string[]; rows: any[][] } => {
  const lines = text.split(/\r?\n/).filter((x) => x.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ','

  const parseLine = (line: string) => {
    const res = []
    let cur = '',
      inQ = false
    for (const c of line) {
      if (c === '"') inQ = !inQ
      else if (c === sep && !inQ) {
        res.push(cur.trim().replace(/^"|"$/g, ''))
        cur = ''
      } else {
        cur += c
      }
    }
    res.push(cur.trim().replace(/^"|"$/g, ''))
    return res
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)

  return { headers, rows }
}

export const validateImportData = (
  headers: string[],
  rows: any[][],
  mapping: Record<string, string>,
  type: TransactionType,
): ParsedRow[] => {
  return rows.map((rowArr, index) => {
    const raw = headers.reduce(
      (acc, h, i) => ({ ...acc, [h]: rowArr[i] }),
      {} as Record<string, any>,
    )
    const errors: string[] = []
    const data: Partial<Transaction> = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      status: 'Pago',
      performer: 'Eu',
      company: 'Grupo Flávio Moura',
      bank: 'Banco Itaú',
    }

    const getVal = (key: string) => raw[mapping[key]]

    const dtStr = getVal('date')?.trim()
    if (!dtStr) {
      errors.push("O campo 'Data' é obrigatório")
    } else {
      let y, m, d

      if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(dtStr)) {
        const parts = dtStr.substring(0, 10).split('-')
        y = parseInt(parts[0], 10)
        m = parseInt(parts[1], 10)
        d = parseInt(parts[2], 10)
      } else if (dtStr.includes('/')) {
        const parts = dtStr.split('/')
        if (parts.length === 3) {
          d = parseInt(parts[0], 10)
          m = parseInt(parts[1], 10)
          y = parseInt(parts[2], 10)
        }
      } else if (dtStr.includes('-')) {
        const parts = dtStr.split('-')
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
        if (isNaN(date.getTime())) {
          errors.push(`Data inválida (${dtStr})`)
        } else {
          data.date = date.toISOString().split('T')[0]
        }
      } else {
        errors.push(`Data inválida (${dtStr})`)
      }
    }

    data.description = getVal('description')?.trim()
    if (!data.description) errors.push("O campo 'Descrição' é obrigatório")

    const valStrRaw = getVal('amount')
    if (!valStrRaw) {
      errors.push("O campo 'Valor' é obrigatório")
    } else {
      let valStr = String(valStrRaw)
        .replace(/R\$\s?/gi, '')
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
        errors.push(`Valor inválido (${valStrRaw})`)
      } else {
        data.amount = parsedVal
      }
    }

    const entityLabel = type === 'Receita' ? 'Cliente' : 'Fornecedor'
    const entity = getVal('entity')?.trim()
    if (!entity) {
      errors.push(`O campo '${entityLabel}' é obrigatório`)
    } else {
      if (type === 'Receita') data.client = entity
      else data.supplier = entity
    }

    const cat = getVal('category')?.trim()
    if (cat) {
      if (type === 'Receita') data.service = cat
      else data.category = cat
    } else {
      if (type === 'Receita') data.service = 'Outros'
      else data.category = 'Outros'
    }

    data.paymentMethod = getVal('paymentMethod')?.trim() || 'PIX'

    return { isValid: errors.length === 0, errors, data, raw, rowIndex: index + 2 }
  })
}
