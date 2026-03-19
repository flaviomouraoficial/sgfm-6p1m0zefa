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

    let dt = getVal('date')
    if (!dt) errors.push('Data é obrigatória')
    else {
      if (dt.includes('/')) dt = dt.split('/').reverse().join('-')
      const date = new Date(dt)
      if (isNaN(date.getTime())) errors.push(`Data inválida (${dt})`)
      else data.date = date.toISOString().split('T')[0]
    }

    data.description = getVal('description')
    if (!data.description) errors.push('Descrição é obrigatória')

    const val = getVal('amount')
    if (!val) errors.push('Valor é obrigatório')
    else {
      const v = parseFloat(String(val).replace(/\./g, '').replace(',', '.'))
      if (isNaN(v)) errors.push(`Valor inválido (${val})`)
      else data.amount = v
    }

    const entity = getVal('entity')
    if (!entity) {
      errors.push(
        type === 'Receita' ? 'Cliente/Mentorado é obrigatório' : 'Fornecedor é obrigatório',
      )
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

    data.paymentMethod = getVal('paymentMethod') || 'PIX'

    return { isValid: errors.length === 0, errors, data, raw, rowIndex: index + 2 }
  })
}
