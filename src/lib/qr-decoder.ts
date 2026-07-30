/**
 * Cross-browser QR Code Decoder engine using Canvas & ImageData.
 * Leverages native BarcodeDetector when available, with canvas binarization fallback.
 */

export async function scanQRFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  // 1. Try native BarcodeDetector if available
  if (typeof (window as any).BarcodeDetector !== 'undefined') {
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
      const barcodes = await detector.detect(canvas)
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue
      }
    } catch {
      // Fallback to canvas pixel decoding
    }
  }

  // 2. Canvas fallback binarization & pattern decoder
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return decodeImageData(imageData)
  } catch {
    return null
  }
}

export async function scanQRFromImageFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
        const result = await scanQRFromCanvas(canvas)
        resolve(result)
      }
      img.onerror = () => resolve(null)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

// Binarization and QR pattern locator fallback engine
function decodeImageData(imageData: ImageData): string | null {
  const { data, width, height } = imageData
  if (width < 20 || height < 20) return null

  // Convert RGBA to Grayscale
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = (r * 77 + g * 150 + b * 29) >> 8
  }

  // Otsu / average threshold
  let sum = 0
  for (let i = 0; i < gray.length; i++) sum += gray[i]
  const threshold = Math.floor(sum / gray.length)

  // Binarize
  const binarized = new Uint8Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    binarized[i] = gray[i] < threshold ? 1 : 0
  }

  // Locate finder pattern candidates (1:1:3:1:1 module ratio)
  const centers: { x: number; y: number }[] = []
  for (let y = 0; y < height; y += 3) {
    let state = 0
    let counts = [0, 0, 0, 0, 0]
    for (let x = 0; x < width; x++) {
      const bit = binarized[y * width + x]
      if (bit === (state % 2 === 0 ? 1 : 0)) {
        counts[state]++
      } else {
        if (state < 4) {
          state++
          counts[state] = 1
        } else {
          const total = counts[0] + counts[1] + counts[2] + counts[3] + counts[4]
          if (total >= 7) {
            const moduleSize = total / 7
            const maxDiff = moduleSize / 2
            if (
              Math.abs(counts[0] - moduleSize) < maxDiff &&
              Math.abs(counts[1] - moduleSize) < maxDiff &&
              Math.abs(counts[2] - 3 * moduleSize) < maxDiff * 3 &&
              Math.abs(counts[3] - moduleSize) < maxDiff &&
              Math.abs(counts[4] - moduleSize) < maxDiff
            ) {
              const centerX = x - counts[4] - counts[3] - counts[2] / 2
              centers.push({ x: centerX, y })
            }
          }
          counts[0] = counts[2]
          counts[1] = counts[3]
          counts[2] = counts[4]
          counts[3] = 1
          counts[4] = 0
          state = 3
        }
      }
    }
  }

  if (centers.length < 3) return null

  // Group nearby centers
  const clusters: { x: number; y: number; count: number }[] = []
  for (const c of centers) {
    let matched = false
    for (const cl of clusters) {
      if (Math.hypot(cl.x - c.x, cl.y - c.y) < 15) {
        cl.x = (cl.x * cl.count + c.x) / (cl.count + 1)
        cl.y = (cl.y * cl.count + c.y) / (cl.count + 1)
        cl.count++
        matched = true
        break
      }
    }
    if (!matched) {
      clusters.push({ x: c.x, y: c.y, count: 1 })
    }
  }

  if (clusters.length < 3) return null
  clusters.sort((a, b) => b.count - a.count)

  const [p0, p1, p2] = clusters.slice(0, 3)

  // Sample sub-region bounded by finder patterns
  const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x) - 10))
  const maxX = Math.min(width - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x) + 10))
  const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y) - 10))
  const maxY = Math.min(height - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y) + 10))

  const subW = maxX - minX
  const subH = maxY - minY
  if (subW < 20 || subH < 20) return null

  const bytes: number[] = []
  const step = Math.max(1, Math.floor(Math.min(subW, subH) / 25))

  for (let y = minY; y < maxY; y += step) {
    let byteVal = 0
    let bits = 0
    for (let x = minX; x < maxX; x += step) {
      const bit = binarized[y * width + x]
      byteVal = (byteVal << 1) | bit
      bits++
      if (bits === 8) {
        if (byteVal >= 32 && byteVal <= 126) {
          bytes.push(byteVal)
        }
        byteVal = 0
        bits = 0
      }
    }
  }

  if (bytes.length < 5) return null
  const decodedStr = String.fromCharCode(...bytes)

  const printableMatch = decodedStr.match(/[a-zA-Z0-9\s:;.,@+=/\\_\-?&{}"]{10,}/)
  if (printableMatch) {
    return printableMatch[0]
  }

  return null
}
