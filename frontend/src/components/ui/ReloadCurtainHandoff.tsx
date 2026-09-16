import { useCallback, useEffect, useState } from 'react'
import { ReloadCurtain } from './ReloadCurtain'
import { clearCurtainHandoff, hasCurtainHandoff, isLandingPath } from '@/lib/reloadCurtain'

/**
 * Mounted once at the app root. On the very first render of a fresh build it
 * looks for the flag the previous build left when the landing page reloaded
 * from the update banner, and if found paints the exit half of the curtain
 * over the first paint so the reload reads as one continuous motion.
 *
 * The initializer only reads the flag (StrictMode runs it twice in dev); the
 * effect clears it once the decision is made.
 */
export function ReloadCurtainHandoff() {
  const [show, setShow] = useState(
    () =>
      typeof window !== 'undefined' &&
      isLandingPath(window.location.pathname) &&
      hasCurtainHandoff(window.sessionStorage)
  )
  const hide = useCallback(() => setShow(false), [])

  useEffect(() => {
    clearCurtainHandoff(window.sessionStorage)
  }, [])

  if (!show) return null
  return <ReloadCurtain phase="exit" onDone={hide} />
}
