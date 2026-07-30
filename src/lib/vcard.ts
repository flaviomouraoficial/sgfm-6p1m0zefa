export interface ParsedVCard {
  nome: string
  empresa: string
  email: string
  whatsapp: string
  isValid: boolean
  rawText?: string
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const PB_ID_REGEX = /^[0-9a-z]{15}$/i
const HEX_HASH_REGEX = /^[0-9a-fA-F]{24,64}$/

/**
 * Checks if a string is a technical identifier (UUID, PocketBase ID, hash, or token)
 * rather than a human-readable contact field.
 */
export function isTechnicalId(val: string): boolean {
  if (!val) return true
  const clean = val.trim()
  if (UUID_REGEX.test(clean)) return true
  if (PB_ID_REGEX.test(clean)) return true
  if (HEX_HASH_REGEX.test(clean)) return true
  if (/^(uid|uuid|id|token|session|auth|hash|key)[:=]/i.test(clean)) return true
  return false
}

function decodeQuotedPrintable(str: string): string {
  try {
    const bytes: number[] = []
    let i = 0
    while (i < str.length) {
      if (str[i] === '=' && i + 2 < str.length) {
        const hex = str.substring(i + 1, i + 3)
        if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
          bytes.push(parseInt(hex, 16))
          i += 3
          continue
        }
      }
      bytes.push(str.charCodeAt(i))
      i++
    }
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(new Uint8Array(bytes))
  } catch {
    return str.replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  }
}

function cleanValue(val: string): string {
  if (!val) return ''
  let res = val.trim()
  if (res.includes('=')) {
    res = decodeQuotedPrintable(res)
  }
  res = res.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ')
  return res.trim()
}

function extractEmail(text: string): string {
  if (!text) return ''
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : ''
}

function extractPhone(text: string): string {
  if (!text) return ''
  let cleaned = text.replace(/^(TEL|TEL;[^:]*|whatsapp|phone|celular):/i, '').trim()
  cleaned = cleaned.replace(/^(https?:\/\/)?(wa\.me\/|api\.whatsapp\.com\/send\?phone=)/i, '')
  cleaned = cleaned.replace(/^tel:/i, '')

  const phoneMatch = cleaned.match(/(\+?\d[\d\s().-]{7,}\d)/)
  if (phoneMatch) {
    return phoneMatch[0].trim()
  }
  return cleaned.length >= 8 && !isTechnicalId(cleaned) ? cleaned : ''
}

/**
 * Robust parser for vCard, MECARD, JSON, Key-Value, and plain text contact QR formats.
 * Ignores technical UUIDs and filters out non-human readable strings.
 */
export function parseVCard(rawText: string): ParsedVCard {
  const text = (rawText || '').trim()
  const result: ParsedVCard = {
    nome: '',
    empresa: '',
    email: '',
    whatsapp: '',
    isValid: false,
    rawText: text,
  }

  if (!text || isTechnicalId(text)) {
    return result
  }

  // 1. Try JSON format
  if (
    (text.startsWith('{') && text.endsWith('}')) ||
    (text.startsWith('[') && text.endsWith(']'))
  ) {
    try {
      const parsedObj = JSON.parse(text)
      const obj = Array.isArray(parsedObj) ? parsedObj[0] : parsedObj
      if (obj && typeof obj === 'object') {
        const rawNome = obj.nome || obj.name || obj.fullName || obj.contact_name || obj.fn || ''
        const rawEmpresa = obj.empresa || obj.company || obj.org || obj.organization || ''
        const rawEmail = obj.email || obj.email_address || ''
        const rawPhone = obj.whatsapp || obj.phone || obj.telefone || obj.tel || obj.celular || ''

        if (rawNome && !isTechnicalId(String(rawNome))) result.nome = String(rawNome).trim()
        if (rawEmpresa && !isTechnicalId(String(rawEmpresa)))
          result.empresa = String(rawEmpresa).trim()
        if (rawEmail) result.email = extractEmail(String(rawEmail))
        if (rawPhone) result.whatsapp = extractPhone(String(rawPhone))

        if (result.nome || result.email || result.whatsapp || result.empresa) {
          result.isValid = !isTechnicalId(result.nome)
          return result
        }
      }
    } catch {
      // Ignore JSON parse error and continue
    }
  }

  // 2. Try MECARD format (e.g., MECARD:N:Moura,Flávio;ORG:Grupo Moura;TEL:43996291060;EMAIL:flavio@trend.com;;)
  if (text.toUpperCase().startsWith('MECARD:')) {
    const body = text.substring(7)
    const parts = body.split(';')
    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx === -1) continue
      const tag = trimmed.substring(0, colonIdx).toUpperCase()
      const val = cleanValue(trimmed.substring(colonIdx + 1))

      if (tag === 'N') {
        if (val.includes(',')) {
          const [last, first] = val.split(',').map((s) => s.trim())
          result.nome = `${first} ${last}`.trim()
        } else {
          result.nome = val
        }
      } else if (tag === 'ORG') {
        result.empresa = val
      } else if (tag === 'TEL') {
        result.whatsapp = extractPhone(val)
      } else if (tag === 'EMAIL') {
        result.email = extractEmail(val)
      }
    }

    if (
      !isTechnicalId(result.nome) &&
      (result.nome || result.email || result.whatsapp || result.empresa)
    ) {
      result.isValid = true
      return result
    }
  }

  // 3. Try Standard vCard (unfolding multi-line continuations)
  const unfoldedText = text.replace(/\r?\n[ \t]/g, '')
  const lines = unfoldedText.split(/\r?\n/)

  let isVCard = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const upperLine = trimmed.toUpperCase()

    if (upperLine.startsWith('BEGIN:VCARD')) {
      isVCard = true
      continue
    }

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const header = trimmed.substring(0, colonIdx).toUpperCase()
    const rawVal = trimmed.substring(colonIdx + 1)
    const val = cleanValue(rawVal)

    if (header === 'FN' || header.startsWith('FN;') || header.startsWith('FN:')) {
      if (!isTechnicalId(val)) {
        result.nome = val
      }
    } else if ((header === 'N' || header.startsWith('N;')) && !result.nome) {
      const parts = rawVal
        .split(';')
        .map((s) => cleanValue(s))
        .filter(Boolean)
      if (parts.length >= 2) {
        const candidate = `${parts[1]} ${parts[0]}`.trim()
        if (!isTechnicalId(candidate)) result.nome = candidate
      } else if (parts.length === 1 && !isTechnicalId(parts[0])) {
        result.nome = parts[0]
      }
    } else if (header === 'ORG' || header.startsWith('ORG;') || header.startsWith('ORG:')) {
      const orgName = val.split(';')[0].trim()
      if (!isTechnicalId(orgName)) {
        result.empresa = orgName
      }
    } else if (header === 'EMAIL' || header.startsWith('EMAIL;') || header.startsWith('EMAIL:')) {
      if (!result.email) {
        result.email = extractEmail(val) || val
      }
    } else if (header === 'TEL' || header.startsWith('TEL;') || header.startsWith('TEL:')) {
      if (!result.whatsapp) {
        result.whatsapp = extractPhone(val) || val
      }
    }
  }

  if (isVCard || result.nome || result.email || result.whatsapp || result.empresa) {
    if (
      !isTechnicalId(result.nome) &&
      (result.nome || result.email || result.whatsapp || result.empresa)
    ) {
      result.isValid = true
      return result
    }
  }

  // 4. Try Key-Value Plain Text lines (e.g., Nome: Flávio Moura, Empresa: Grupo Moura)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const lower = trimmed.toLowerCase()
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const key = lower.substring(0, colonIdx).trim()
    const val = cleanValue(trimmed.substring(colonIdx + 1))

    if (['nome', 'name', 'contato', 'fullname', 'full name'].includes(key)) {
      if (!isTechnicalId(val)) result.nome = val
    } else if (['empresa', 'company', 'org', 'organizacao', 'organização'].includes(key)) {
      if (!isTechnicalId(val)) result.empresa = val
    } else if (['email', 'e-mail', 'mail'].includes(key)) {
      result.email = extractEmail(val) || val
    } else if (['whatsapp', 'whats', 'telefone', 'tel', 'phone', 'celular'].includes(key)) {
      result.whatsapp = extractPhone(val) || val
    }
  }

  // 5. Try standalone email/phone extraction if fields are still missing
  if (!result.email) {
    result.email = extractEmail(text)
  }
  if (!result.whatsapp) {
    result.whatsapp = extractPhone(text)
  }

  // Final check: clear out technical IDs from fields
  if (isTechnicalId(result.nome)) result.nome = ''
  if (isTechnicalId(result.empresa)) result.empresa = ''

  result.isValid = Boolean(
    (result.nome || result.email || result.whatsapp || result.empresa) &&
    !isTechnicalId(result.nome),
  )

  return result
}
