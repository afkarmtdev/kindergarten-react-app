import { useState, useEffect, useCallback } from 'react'
import { APP_VERSION } from '@/lib/version'

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  const check = useCallback(async () => {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' })
      if (!res.ok) return
      const { version } = await res.json()
      if (version && version !== APP_VERSION) {
        setUpdateAvailable(true)
      }
    } catch {
      // silently ignore — network error or offline
    }
  }, [])

  useEffect(() => {
    check()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [check])

  return { updateAvailable }
}
