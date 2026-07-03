export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  let pdfString = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    pdfString += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize)) as number[],
    )
  }

  const lines: string[] = []

  const unescapePdf = (s: string): string => {
    return s
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\(\d{1,3})/g, (_m, oct: string) => String.fromCharCode(parseInt(oct, 8)))
  }

  const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g
  let match: RegExpExecArray | null
  while ((match = tjRegex.exec(pdfString)) !== null) {
    const text = unescapePdf(match[1])
    if (text.trim()) lines.push(text)
  }

  const tjArrayRegex = /\[((?:[^[\]]|\\.)*)\]\s*TJ/g
  while ((match = tjArrayRegex.exec(pdfString)) !== null) {
    const inner = match[1]
    const textParts: string[] = []
    const partRegex = /\(((?:[^()\\]|\\.)*)\)/g
    let partMatch: RegExpExecArray | null
    while ((partMatch = partRegex.exec(inner)) !== null) {
      textParts.push(unescapePdf(partMatch[1]))
    }
    const combined = textParts.join('')
    if (combined.trim()) lines.push(combined)
  }

  const hexRegex = /<([0-9A-Fa-f]+)>\s*Tj/g
  while ((match = hexRegex.exec(pdfString)) !== null) {
    const hex = match[1]
    let text = ''
    for (let i = 0; i + 1 < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16)
      if (code >= 32 && code <= 126) text += String.fromCharCode(code)
    }
    if (text.trim()) lines.push(text)
  }

  const hexArrayRegex = /\[([^\]]*)\]\s*TJ/g
  while ((match = hexArrayRegex.exec(pdfString)) !== null) {
    const inner = match[1]
    const hexParts = inner.match(/<([0-9A-Fa-f]+)>/g)
    if (hexParts) {
      const combined = hexParts
        .map((h) => {
          const hex = h.slice(1, -1)
          let text = ''
          for (let i = 0; i + 1 < hex.length; i += 2) {
            const code = parseInt(hex.substr(i, 2), 16)
            if (code >= 32 && code <= 126) text += String.fromCharCode(code)
          }
          return text
        })
        .join('')
      if (combined.trim()) lines.push(combined)
    }
  }

  return lines.join('\n')
}
