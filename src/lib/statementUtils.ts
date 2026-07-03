import { Transaction } from '@/lib/types'
import { parseCSVContent } from '@/lib/importUtils'

export interface ParsedStatementRow {
  date: string
  description: string
  documentNumber: string
  amount: number
  type: 'Receita' | 'Despesa'
  category: string
}

export interface StatementMatchResult {
  row: ParsedStatementRow
  isDuplicate: boolean
  duplicateReason?: string
  existingPendingMatch?: Transaction
  selected: boolean
}

export function parseOFX(text: string): ParsedStatementRow[] {
  const rows: ParsedStatementRow[] = []
  const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const trn = match[1]
    const dt = trn.match(/<DTPOSTED>(.*?)(?:\[|\r|\n)/)
    const amt = trn.match(/<TRNAMT>(.*?)(?:\[|\r|\n)/)
    const memo = trn.match(/<MEMO>(.*?)(?:\[|\r|\n)/)
    const doc = trn.match(/<CHECKNUM>(.*?)(?:\[|\r|\n)/) || trn.match(/<REFNUM>(.*?)(?:\[|\r|\n)/)
    if (dt && amt) {
      const amount = parseFloat(amt[1])
      const d = dt[1]
      rows.push({
        date: `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`,
        description: memo ? memo[1].trim() : 'Transação Bancária',
        documentNumber: doc ? doc[1].trim() : '',
        amount: Math.abs(amount),
        type: amount >= 0 ? 'Receita' : 'Despesa',
        category: 'Outros',
      })
    }
  }
  return rows
}

function parseAmount(str: string): number {
  const cleaned = str
    .replace(/R\$\s?/gi, '')
    .replace(/\s+/g, '')
    .trim()
  if (!cleaned) return NaN
  const lc = cleaned.lastIndexOf(',')
  const ld = cleaned.lastIndexOf('.')
  if (lc > ld) return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  if (ld > lc) return parseFloat(cleaned.replace(/,/g, ''))
  if (lc !== -1) return parseFloat(cleaned.replace(',', '.'))
  return parseFloat(cleaned)
}

function parseDate(str: string): string {
  const s = str.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
  if (s.includes('/')) {
    const parts = s.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      return `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  return s
}

export function parseCSVWithMapping(
  text: string,
  mapping: Record<string, string>,
): ParsedStatementRow[] {
  const { headers, rows } = parseCSVContent(text)
  return rows
    .map((rowArr) => {
      const raw = headers.reduce(
        (acc, h, i) => ({ ...acc, [h]: rowArr[i] }),
        {} as Record<string, any>,
      )
      const amount = parseAmount(String(raw[mapping.amount] || ''))
      return {
        date: parseDate(String(raw[mapping.date] || '')),
        description: String(raw[mapping.description] || '').trim(),
        documentNumber: String(raw[mapping.documentNumber] || '').trim(),
        amount: Math.abs(amount),
        type: amount >= 0 ? 'Receita' : 'Despesa',
        category: 'Outros',
      }
    })
    .filter((r) => r.date && r.description && !isNaN(r.amount))
}

export function parseRowsWithMapping(
  headers: string[],
  rows: any[][],
  mapping: Record<string, string>,
): ParsedStatementRow[] {
  return rows
    .map((rowArr) => {
      const raw = headers.reduce(
        (acc, h, i) => ({ ...acc, [h]: rowArr[i] }),
        {} as Record<string, any>,
      )
      const amountStr = String(raw[mapping.amount] || '')
      const amount = parseAmount(amountStr)
      return {
        date: parseDate(String(raw[mapping.date] || '')),
        description: String(raw[mapping.description] || '').trim(),
        documentNumber: String(raw[mapping.documentNumber] || '').trim(),
        amount: Math.abs(amount),
        type: amount >= 0 ? 'Receita' : 'Despesa',
        category: 'Outros',
      }
    })
    .filter((r) => r.date && r.description && !isNaN(r.amount))
}

export function autoDetectMapping(headers: string[]): Record<string, string> {
  const hLow = headers.map((h) => h.toLowerCase())
  const find = (kws: string[]) => {
    const idx = hLow.findIndex((h) => kws.some((k) => h.includes(k)))
    return idx >= 0 ? headers[idx] : ''
  }
  return {
    date: find(['data', 'date', 'dt ', 'dtpost']),
    description: find(['desc', 'hist', 'memo', 'history', 'narrat']),
    documentNumber: find(['doc', 'document', 'num', 'check', 'ref']),
    amount: find(['valor', 'amount', 'value', 'montant']),
  }
}

export function findDuplicatesAndMatches(
  rows: ParsedStatementRow[],
  existing: Transaction[],
  contaId: string,
): StatementMatchResult[] {
  return rows.map((row) => {
    const duplicate = existing.find(
      (t) =>
        t.date?.substring(0, 10) === row.date &&
        t.amount === row.amount &&
        t.description?.toLowerCase() === row.description.toLowerCase(),
    )
    const pendingMatch = existing.find(
      (t) =>
        !t.conciliado && t.amount === row.amount && t.type === row.type && t.conta_id === contaId,
    )
    return {
      row,
      isDuplicate: !!duplicate,
      duplicateReason: duplicate
        ? 'Duplicata: mesma data, valor e descrição já existem'
        : undefined,
      existingPendingMatch: pendingMatch,
      selected: !duplicate,
    }
  })
}
