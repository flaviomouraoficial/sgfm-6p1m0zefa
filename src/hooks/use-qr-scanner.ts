import { useState, useRef, useCallback, useEffect } from 'react'
import { scanQRFromCanvas, scanQRFromImageFile } from '@/lib/qr-decoder'

type ScanState = 'idle' | 'scanning' | 'success' | 'error'

interface UseQrScannerResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  state: ScanState
  error: string | null
  start: () => Promise<void>
  stop: () => void
  scanFile: (file: File) => Promise<boolean>
}

export function useQrScanner(onResult: (text: string) => void): UseQrScannerResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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
        setError(
          'Câmera não disponível. Verifique se há uma câmera conectada ou utilize a entrada manual.',
        )
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
      let detector: any = null
      if (hasBarcodeDetector) {
        try {
          detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        } catch {
          detector = null
        }
      }

      let frameCount = 0

      const scanLoop = async () => {
        if (stoppedRef.current || !videoRef.current) return
        const video = videoRef.current

        if (video.readyState >= 2 && video.videoWidth > 0) {
          frameCount++
          let foundText: string | null = null

          // Try native detector first
          if (detector) {
            try {
              const barcodes = await detector.detect(video)
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                foundText = barcodes[0].rawValue
              }
            } catch {
              // Ignore native failure and try canvas fallback
            }
          }

          // Fallback canvas scan every 3 frames if native detector is absent or failed
          if (!foundText && frameCount % 3 === 0) {
            try {
              let canvas = canvasRef.current
              if (!canvas) {
                canvas = document.createElement('canvas')
              }
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.drawImage(video, 0, 0)
                foundText = await scanQRFromCanvas(canvas)
              }
            } catch {
              // Continue scanning
            }
          }

          if (foundText) {
            setState('success')
            stop()
            onResultRef.current(foundText)
            return
          }
        }

        rafRef.current = requestAnimationFrame(scanLoop)
      }

      rafRef.current = requestAnimationFrame(scanLoop)
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setError('Permissão de câmera negada. Verifique as configurações do seu navegador.')
      } else {
        setError(
          'Câmera não disponível. Verifique se há uma câmera conectada ou utilize a entrada manual.',
        )
      }
      setState('error')
    }
  }, [stop])

  const scanFile = useCallback(
    async (file: File): Promise<boolean> => {
      setError(null)
      try {
        const text = await scanQRFromImageFile(file)
        if (text) {
          setState('success')
          stop()
          onResultRef.current(text)
          return true
        } else {
          setError('Não foi possível ler um QR Code válido nesta imagem.')
          return false
        }
      } catch {
        setError('Erro ao processar imagem.')
        return false
      }
    },
    [stop],
  )

  useEffect(() => {
    return () => {
      stoppedRef.current = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  return { videoRef, canvasRef, state, error, start, stop, scanFile }
}
