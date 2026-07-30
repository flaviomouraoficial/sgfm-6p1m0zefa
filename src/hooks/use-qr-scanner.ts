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
  const onResultRef = useRef(onResult)
  const [state, setState] = useState<ScanState>('idle')
  const [error, setError] = useState<string | null>(null)

  onResultRef.current = onResult

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
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setError('Seu navegador não suporta acesso à câmera. Insira os dados manualmente.')
        setState('error')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream

      if (stoppedRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        video.muted = true

        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve()
          } else {
            const onLoaded = () => {
              video.removeEventListener('loadedmetadata', onLoaded)
              resolve()
            }
            video.addEventListener('loadedmetadata', onLoaded)
            setTimeout(() => {
              video.removeEventListener('loadedmetadata', onLoaded)
              resolve()
            }, 2000)
          }
        })

        if (stoppedRef.current) return

        await video.play().catch(() => {})
      }

      const hasBarcodeDetector = typeof (window as any).BarcodeDetector !== 'undefined'

      if (!hasBarcodeDetector) {
        setError('Seu navegador não suporta leitura de QR Code. Insira os dados manualmente.')
        setState('error')
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
        return
      }

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
              onResultRef.current(raw)
              return
            }
          }
        } catch {
          // Continue scanning
        }
        rafRef.current = requestAnimationFrame(scanLoop)
      }
      rafRef.current = requestAnimationFrame(scanLoop)
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setError('Permissão de câmera negada. Insira os dados manualmente.')
      } else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
        setError('Nenhuma câmera encontrada no dispositivo. Insira os dados manualmente.')
      } else if (err?.name === 'NotReadableError') {
        setError('A câmera está em uso por outro aplicativo. Insira os dados manualmente.')
      } else {
        setError('Não foi possível acessar a câmera. Insira os dados manualmente.')
      }
      setState('error')
    }
  }, [stop])

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
