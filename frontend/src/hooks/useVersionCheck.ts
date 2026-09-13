import { useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { APP_VERSION } from '@/lib/version'

const CHECK_INTERVAL_MS = 60 * 60 * 1000
const ACTIVATE_TIMEOUT_MS = 12_000

/**
 * Detects a newer deployed build and applies it on request.
 *
 * Two signals, either one raises `updateAvailable`:
 * 1. Service worker (prompt mode) — a new sw.js has installed and is waiting.
 * 2. version.json — the bundled APP_VERSION differs from the one on the server.
 *    Covers browsers with no service worker support (e.g. private browsing).
 *
 * Checks run on mount, hourly, when the tab becomes visible, and on bfcache restore
 * (`pageshow` with `persisted`) — iOS Safari brings tabs back for days without a navigation.
 *
 * Mount once at the app root; every registration call adds listeners for the page lifetime.
 */
export function useVersionCheck() {
  const [versionMismatch, setVersionMismatch] = useState(false)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef.current = registration ?? null
    },
  })

  const check = useCallback(async () => {
    registrationRef.current?.update().catch(() => {
      // sw.js fetch failed — offline or server hiccup, try again next time
    })
    try {
      const res = await fetch('/version.json', { cache: 'no-store' })
      if (!res.ok) return
      const { version } = await res.json()
      if (version && version !== APP_VERSION) setVersionMismatch(true)
    } catch {
      // network error or offline — silently ignore
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [check])

  /**
   * Activates the waiting worker (which reloads the page via the register helper's
   * 'controlling' listener) or falls back to a plain reload when there is no worker.
   * A safety timer reloads anyway in case activation never reports back.
   */
  const applyUpdate = useCallback(async () => {
    const registration = registrationRef.current
    if (!registration) {
      window.location.reload()
      return
    }

    try {
      await registration.update()
    } catch {
      // update() rejects when sw.js cannot be fetched — carry on with what we have
    }

    if (registration.installing) await waitForInstalled(registration.installing)

    setTimeout(() => window.location.reload(), ACTIVATE_TIMEOUT_MS)
    if (registration.waiting) {
      await updateServiceWorker(true)
    } else {
      window.location.reload()
    }
  }, [updateServiceWorker])

  return { updateAvailable: needRefresh || versionMismatch, applyUpdate }
}

function waitForInstalled(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ACTIVATE_TIMEOUT_MS)
    function done() {
      clearTimeout(timer)
      worker.removeEventListener('statechange', onStateChange)
      resolve()
    }
    function onStateChange() {
      if (worker.state !== 'installing') done()
    }
    worker.addEventListener('statechange', onStateChange)
  })
}
