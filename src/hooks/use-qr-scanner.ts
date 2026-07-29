import { useState, useRef, useCallback, useEffect } from 'react'

type ScanState = 'idle' | 'scanning' | 'success' | 'error'

interface UseQrScannerResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  state: ScanState
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

export function useQrScanner(onResult: (text: string) => void): UseQrScannerResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const stoppedRef = useRef(false)
  const [state, setState] = useState<ScanState>('idle')
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    stoppedRef.current = true
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setState('idle')
  }, [])

  const start = useCallback(async () => {
    stoppedRef.current = false
    setError(null)
    setState('scanning')

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Seu navegador não suporta acesso à câmera.')
        setState('error')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (stoppedRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      const hasBarcodeDetector = typeof (window as any).BarcodeDetector !== 'undefined'

      if (hasBarcodeDetector) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        })

        const scanLoop = async () => {
          if (stoppedRef.current || !videoRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes && barcodes.length > 0) {
              const raw = barcodes[0].rawValue
              if (raw) {
                setState('success')
                stop()
                onResult(raw)
                return
              }
            }
          } catch {
            // Continue scanning
          }
          rafRef.current = requestAnimationFrame(scanLoop)
        }
        rafRef.current = requestAnimationFrame(scanLoop)
      } else {
        setError('Seu navegador não suporta leitura de QR Code. Use a entrada manual.')
        setState('error')
        stop()
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Use a entrada manual.')
      } else if (err?.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.')
      } else {
        setError('Não foi possível acessar a câmera.')
      }
      setState('error')
    }
  }, [onResult, stop])

  useEffect(() => {
    return () => {
      stoppedRef.current = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  return { videoRef, state, error, start, stop }
}
