import { useEffect, useState } from 'react'

import {
  ConnectPopupBlockedError,
  connect,
  disconnect,
  listConnectors,
  type ConnectorStatus,
} from '../../lib/skipConnectors'

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** Connect / reconnect / disconnect one toolkit for the signed-in user. */
export function ConnectorButton({
  toolkit,
  name,
  className,
}: {
  toolkit: string
  name: string
  className?: string
}) {
  const [status, setStatus] = useState<ConnectorStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The consent page, when the browser blocked opening it: offered as a link.
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    listConnectors()
      .then((all) => {
        if (!cancelled) {
          const found = all.find((c) => c.toolkit === toolkit)
          setStatus(found?.status ?? 'not_connected')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          // If connectors endpoint returns 503 (not enabled yet or pending owner connection),
          // treat as 'not_connected' so the connect button stays clickable.
          const msg = errorText(e)
          if (msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('503')) {
            setStatus('not_connected')
          } else {
            setStatus('not_connected')
            setError(msg)
          }
        }
      })
    return () => {
      cancelled = true
    }
  }, [toolkit])

  // Back from the consent window (a framed app connects in a new one): refresh
  // the status in place, without resetting it, so the button shows the change.
  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      listConnectors()
        .then((all) => {
          if (!cancelled) {
            const found = all.find((c) => c.toolkit === toolkit)
            setStatus(found?.status ?? 'not_connected')
          }
        })
        .catch(() => {
          // The next click or load reports it; a background refresh must not.
        })
    }
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('focus', refresh)
    }
  }, [toolkit])

  const onClick = async () => {
    setBusy(true)
    setError(null)
    setBlockedUrl(null)
    try {
      if (status === 'connected') {
        await disconnect(toolkit)
        setStatus('not_connected')
      } else {
        await connect(toolkit)
      }
    } catch (e: unknown) {
      if (e instanceof ConnectPopupBlockedError) {
        setBlockedUrl(e.url)
      } else {
        const msg = errorText(e)
        // Amortecer mensagem bruta de 503 se o conector ainda estiver pendente no builder
        if (msg.toLowerCase().includes('connectors are not enabled')) {
          setError(
            'Conectores aguardando habilitação no painel Skip Cloud / Conectores do proprietário.',
          )
        } else {
          setError(msg)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const effectiveStatus = status ?? 'not_connected'

  const label = busy
    ? effectiveStatus === 'connected'
      ? 'Desconectando…'
      : 'Conectando…'
    : effectiveStatus === 'connected'
      ? `${name} conectado · Desconectar`
      : effectiveStatus === 'expired'
        ? `Reconectar ${name}`
        : `Conectar ${name}`

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
      >
        {label}
      </button>
      {blockedUrl && (
        <a
          href={blockedUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setBlockedUrl(null)}
          className="ml-2 text-sm underline"
        >
          Abrir página de conexão
        </a>
      )}
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
