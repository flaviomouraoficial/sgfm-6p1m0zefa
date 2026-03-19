function crc32(bytes: Uint8Array) {
  let c = 0 ^ -1
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
    }
  }
  return (c ^ -1) >>> 0
}

function colName(n: number) {
  let s = ''
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

function getColIndex(r: string) {
  const match = r.match(/[A-Z]+/)
  if (!match) return 0
  const letters = match[0]
  let col = 0
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64)
  }
  return col - 1
}

export function writeXlsx(rows: any[][]): Blob {
  const enc = new TextEncoder()
  const files = [
    {
      name: '[Content_Types].xml',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      ),
    },
    {
      name: '_rels/.rels',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: 'xl/workbook.xml',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      ),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows
          .map(
            (row, i) =>
              `<row r="${i + 1}">${row
                .map((cell, j) => {
                  const ref = colName(j) + (i + 1)
                  const val =
                    cell === null || cell === undefined
                      ? ''
                      : String(cell)
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                  return `<c r="${ref}" t="inlineStr"><is><t>${val}</t></is></c>`
                })
                .join('')}</row>`,
          )
          .join('')}</sheetData></worksheet>`,
      ),
    },
  ]

  const zipData: Uint8Array[] = []
  const cdRecords: Uint8Array[] = []
  let offset = 0

  for (const f of files) {
    const nameBytes = enc.encode(f.name)
    const data = f.data
    const crc = crc32(data)
    const lh = new ArrayBuffer(30)
    const ldv = new DataView(lh)

    ldv.setUint32(0, 0x04034b50, true)
    ldv.setUint16(4, 20, true)
    ldv.setUint32(14, crc, true)
    ldv.setUint32(18, data.length, true)
    ldv.setUint32(22, data.length, true)
    ldv.setUint16(26, nameBytes.length, true)
    zipData.push(new Uint8Array(lh), nameBytes, data)

    const cd = new ArrayBuffer(46)
    const cdv = new DataView(cd)
    cdv.setUint32(0, 0x02014b50, true)
    cdv.setUint16(4, 20, true)
    cdv.setUint16(6, 20, true)
    cdv.setUint32(16, crc, true)
    cdv.setUint32(20, data.length, true)
    cdv.setUint32(24, data.length, true)
    cdv.setUint16(28, nameBytes.length, true)
    cdv.setUint32(42, offset, true)
    cdRecords.push(new Uint8Array(cd), nameBytes)

    offset += 30 + nameBytes.length + data.length
  }

  const eocd = new ArrayBuffer(22)
  const edv = new DataView(eocd)
  edv.setUint32(0, 0x06054b50, true)
  edv.setUint16(8, files.length, true)
  edv.setUint16(10, files.length, true)
  edv.setUint32(
    12,
    cdRecords.reduce((acc, c) => acc + c.length, 0),
    true,
  )
  edv.setUint32(16, offset, true)

  return new Blob([...zipData, ...cdRecords, new Uint8Array(eocd)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export async function parseXlsx(blob: Blob): Promise<{ headers: string[]; rows: any[][] }> {
  const buffer = await blob.arrayBuffer()
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  let eocdOffset = -1
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) throw new Error('Not a valid zip/xlsx file')

  const cdOffset = view.getUint32(eocdOffset + 16, true)
  const cdRecords = view.getUint16(eocdOffset + 10, true)

  let offset = cdOffset
  const files: Record<string, string> = {}

  for (let i = 0; i < cdRecords; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break
    const method = view.getUint16(offset + 10, true)
    const compSize = view.getUint32(offset + 20, true)
    const nameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    const lhOffset = view.getUint32(offset + 42, true)
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLen))

    if (name === 'xl/worksheets/sheet1.xml' || name === 'xl/sharedStrings.xml') {
      const lhNameLen = view.getUint16(lhOffset + 26, true)
      const lhExtraLen = view.getUint16(lhOffset + 28, true)
      const dataOffset = lhOffset + 30 + lhNameLen + lhExtraLen
      const compData = bytes.subarray(dataOffset, dataOffset + compSize)

      if (method === 8) {
        try {
          const ds = new DecompressionStream('deflate-raw')
          const writer = ds.writable.getWriter()
          writer.write(compData)
          writer.close()
          files[name] = await new Response(ds.readable).text()
        } catch (e) {
          console.error('Decompression failed for', name, e)
        }
      } else if (method === 0) {
        files[name] = new TextDecoder().decode(compData)
      }
    }
    offset += 46 + nameLen + extraLen + commentLen
  }

  const parser = new DOMParser()
  let strings: string[] = []

  if (files['xl/sharedStrings.xml']) {
    const doc = parser.parseFromString(files['xl/sharedStrings.xml'], 'text/xml')
    strings = Array.from(doc.querySelectorAll('si')).map((si) => si.textContent || '')
  }

  if (!files['xl/worksheets/sheet1.xml']) return { headers: [], rows: [] }

  const sheetDoc = parser.parseFromString(files['xl/worksheets/sheet1.xml'], 'text/xml')
  const sheetRows: string[][] = []

  for (const row of Array.from(sheetDoc.querySelectorAll('row'))) {
    const rowIndexStr = row.getAttribute('r')
    const rowIndex = rowIndexStr ? parseInt(rowIndexStr, 10) - 1 : sheetRows.length
    const cells: string[] = []

    for (const c of Array.from(row.querySelectorAll('c'))) {
      const r = c.getAttribute('r')
      const colIdx = r ? getColIndex(r) : cells.length
      const type = c.getAttribute('t')
      const vTag = c.querySelector('v')
      let val = vTag ? vTag.textContent || '' : ''

      if (type === 's') {
        val = strings[parseInt(val, 10)] || ''
      } else if (type === 'inlineStr') {
        const isTag = c.querySelector('t')
        val = isTag ? isTag.textContent || '' : ''
      }
      cells[colIdx] = val
    }

    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === undefined) cells[i] = ''
    }
    sheetRows[rowIndex] = cells
  }

  const validRows = sheetRows.filter((r) => r && r.length > 0).map((r) => r || [])
  if (validRows.length < 2) return { headers: validRows[0] || [], rows: [] }

  const headers = validRows[0].map((h) => h.trim())
  const dataRows = validRows.slice(1).map((r) => {
    const padded = [...r]
    while (padded.length < headers.length) padded.push('')
    return padded.map((c) => c.trim())
  })

  return { headers, rows: dataRows }
}
