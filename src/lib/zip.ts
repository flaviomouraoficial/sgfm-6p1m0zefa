// Minimal uncompressed ZIP (STORE method) and raw PDF generator

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

export function createZip(files: { name: string; data: Uint8Array }[]): Blob {
  const localFileHeaders: Uint8Array[] = []
  const centralDirectoryHeaders: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name)
    const crc = crc32(file.data)
    const size = file.data.length

    // Local file header
    const lfh = new Uint8Array(30 + nameBytes.length)
    const lfhView = new DataView(lfh.buffer)
    lfhView.setUint32(0, 0x04034b50, true) // Signature
    lfhView.setUint16(4, 20, true) // Version
    lfhView.setUint16(6, 0, true) // Flags
    lfhView.setUint16(8, 0, true) // Compression (0 = STORE)
    lfhView.setUint16(10, 0, true) // Mod time
    lfhView.setUint16(12, 0, true) // Mod date
    lfhView.setUint32(14, crc, true) // CRC32
    lfhView.setUint32(18, size, true) // Compressed size
    lfhView.setUint32(22, size, true) // Uncompressed size
    lfhView.setUint16(26, nameBytes.length, true) // Name length
    lfhView.setUint16(28, 0, true) // Extra field length
    lfh.set(nameBytes, 30)

    localFileHeaders.push(lfh)
    localFileHeaders.push(file.data)

    // Central directory header
    const cdh = new Uint8Array(46 + nameBytes.length)
    const cdhView = new DataView(cdh.buffer)
    cdhView.setUint32(0, 0x02014b50, true) // Signature
    cdhView.setUint16(4, 20, true) // Version made by
    cdhView.setUint16(6, 20, true) // Version needed
    cdhView.setUint16(8, 0, true) // Flags
    cdhView.setUint16(10, 0, true) // Compression
    cdhView.setUint16(12, 0, true) // Mod time
    cdhView.setUint16(14, 0, true) // Mod date
    cdhView.setUint32(16, crc, true) // CRC32
    cdhView.setUint32(20, size, true) // Compressed size
    cdhView.setUint32(24, size, true) // Uncompressed size
    cdhView.setUint16(28, nameBytes.length, true) // Name length
    cdhView.setUint16(30, 0, true) // Extra field length
    cdhView.setUint16(32, 0, true) // File comment length
    cdhView.setUint16(34, 0, true) // Disk number
    cdhView.setUint16(36, 0, true) // Internal attrs
    cdhView.setUint32(38, 0, true) // External attrs
    cdhView.setUint32(42, offset, true) // Local header offset
    cdh.set(nameBytes, 46)

    centralDirectoryHeaders.push(cdh)
    offset += lfh.length + size
  }

  const cdSize = centralDirectoryHeaders.reduce((acc, h) => acc + h.length, 0)

  // End of central directory
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true) // Signature
  eocdView.setUint16(4, 0, true) // Disk number
  eocdView.setUint16(6, 0, true) // Disk where CD starts
  eocdView.setUint16(8, files.length, true) // CD records on this disk
  eocdView.setUint16(10, files.length, true) // Total CD records
  eocdView.setUint32(12, cdSize, true) // CD size
  eocdView.setUint32(16, offset, true) // CD offset

  return new Blob([...localFileHeaders, ...centralDirectoryHeaders, eocd], {
    type: 'application/zip',
  })
}

export function createSimplePdf(lines: string[]): Uint8Array {
  let contentStream = 'BT\n/F1 12 Tf\n10 750 Td\n'
  for (const line of lines) {
    const sanitized = line.replace(/[^ -~]/g, '')
    const escaped = sanitized.replace(/[()\\]/g, '\\$&')
    contentStream += `(${escaped}) Tj\n0 -15 Td\n`
  }
  contentStream += 'ET\n'

  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`
  const obj4 = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`

  let pdf = `%PDF-1.4\n`
  const offsets = [0]

  offsets.push(pdf.length)
  pdf += obj1
  offsets.push(pdf.length)
  pdf += obj2
  offsets.push(pdf.length)
  pdf += obj3
  offsets.push(pdf.length)
  pdf += obj4
  offsets.push(pdf.length)
  pdf += obj5

  const xrefOffset = pdf.length
  pdf += `xref\n0 6\n`
  pdf += `0000000000 65535 f \n`
  for (let i = 1; i <= 5; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return new TextEncoder().encode(pdf)
}
