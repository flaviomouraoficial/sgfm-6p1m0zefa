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
  return parseRowsWithMapping(headers, rows, mapping)
}

export function parseRowsWithMapping(
  headers: string[],
  rows: any[][],
  mapping: Record<string, string>,
): ParsedStatementRow[] {
  const isSameColumn = mapping.credit && mapping.debit && mapping.credit === mapping.debit
  const hasCredit = !!mapping.credit
  const hasDebit = !!mapping.debit

  return rows
    .map((rowArr) => {
      const raw = headers.reduce(
        (acc, h, i) => ({ ...acc, [h]: rowArr[i] }),
        {} as Record<string, any>,
      )

      let amount = NaN
      let type: 'Receita' | 'Despesa' = 'Receita'

      if (isSameColumn || (hasCredit && !hasDebit)) {
        const parsed = parseAmount(String(raw[mapping.credit] || ''))
        if (!isNaN(parsed) && parsed !== 0) {
          amount = Math.abs(parsed)
          type = parsed >= 0 ? 'Receita' : 'Despesa'
        }
      } else if (hasDebit && !hasCredit) {
        const parsed = parseAmount(String(raw[mapping.debit] || ''))
        if (!isNaN(parsed) && parsed !== 0) {
          amount = Math.abs(parsed)
          type = parsed >= 0 ? 'Receita' : 'Despesa'
        }
      } else if (hasCredit && hasDebit) {
        const creditVal = parseAmount(String(raw[mapping.credit] || ''))
        const debitVal = parseAmount(String(raw[mapping.debit] || ''))
        if (!isNaN(creditVal) && creditVal !== 0) {
          amount = Math.abs(creditVal)
          type = 'Receita'
        } else if (!isNaN(debitVal) && debitVal !== 0) {
          amount = Math.abs(debitVal)
          type = 'Despesa'
        }
      }

      return {
        date: parseDate(String(raw[mapping.date] || '')),
        description: String(raw[mapping.description] || '').trim(),
        documentNumber: String(raw[mapping.documentNumber] || '').trim(),
        amount,
        type,
        category: 'Outros',
      }
    })
    .filter((r) => r.date && r.description && !isNaN(r.amount) && r.amount > 0)
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
    credit: find(['crédito', 'credito', 'entrada', 'credit', 'receita', 'depósito', 'deposito']),
    debit: find(['débito', 'debito', 'saída', 'saida', 'debit', 'despesa', 'pagamento']),
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
