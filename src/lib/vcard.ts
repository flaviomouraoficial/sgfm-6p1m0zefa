interface ParsedVCard {
  nome: string
  empresa: string
  email: string
  whatsapp: string
}

export function parseVCard(text: string): ParsedVCard {
  const result: ParsedVCard = {
    nome: '',
    empresa: '',
    email: '',
    whatsapp: '',
  }

  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const upperKey = trimmed.toUpperCase()

    if (upperKey.startsWith('FN:') || upperKey.startsWith('FN;')) {
      result.nome = trimmed.substring(trimmed.indexOf(':') + 1).trim()
    } else if (upperKey.startsWith('N:') || upperKey.startsWith('N;')) {
      if (!result.nome) {
        const raw = trimmed.substring(trimmed.indexOf(':') + 1).trim()
        const parts = raw.split(';').filter(Boolean)
        if (parts.length >= 2) {
          result.nome = `${parts[1]} ${parts[0]}`.trim()
        } else {
          result.nome = parts[0] || raw
        }
      }
    } else if (upperKey.startsWith('ORG:') || upperKey.startsWith('ORG;')) {
      result.empresa = trimmed
        .substring(trimmed.indexOf(':') + 1)
        .trim()
        .split(';')[0]
    } else if (upperKey.startsWith('EMAIL:') || upperKey.startsWith('EMAIL;')) {
      if (!result.email) {
        result.email = trimmed.substring(trimmed.indexOf(':') + 1).trim()
      }
    } else if (upperKey.startsWith('TEL:') || upperKey.startsWith('TEL;')) {
      if (!result.whatsapp) {
        result.whatsapp = trimmed.substring(trimmed.indexOf(':') + 1).trim()
      }
    }
  }

  if (!result.nome && !result.empresa && !result.email && !result.whatsapp) {
    result.nome = text.trim().substring(0, 200)
  }

  return result
}
